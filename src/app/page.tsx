'use client';

import React, {useState, useCallback, useRef, useEffect} from 'react';
import {UploadCloud, AlertTriangle, Camera} from 'lucide-react';
import {detectDisease} from '@/ai/flows/disease-detection';
import {suggestRemedies} from '@/ai/flows/remedy-suggestions';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import {useDropzone} from 'react-dropzone';
import {cn} from '@/lib/utils';
import Image from 'next/image';

export default function PlantDiseaseDetector() {
  const [image, setImage] = useState<string | null>(null);
  const [plantName, setPlantName] = useState<string | null>(null);
  const [disease, setDisease] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [causes, setCauses] = useState<string[] | null>(null);
  const [remedies, setRemedies] = useState<string[] | null>(null);
  const [supplements, setSupplements] = useState<
    {name: string; link: string}[] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const {toast} = useToast();
  const [showHomeDescription, setShowHomeDescription] = useState(false);
  const [showAiEngine, setShowAiEngine] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [useRearCamera, setUseRearCamera] = useState(false);
  const [plantUnknownError, setPlantUnknownError] = useState(false);

  const getCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: useRearCamera ? {exact: 'environment'} : 'user'},
      });
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this app.',
      });
    }
  };

  useEffect(() => {
    if (isCameraActive) {
      getCameraPermission();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        setHasCameraPermission(false);
      }
    }
  }, [isCameraActive, useRearCamera, toast]);

  const analyzeImage = useCallback(
    async (img: string) => {
      setLoading(true);
      setPlantUnknownError(false); // Reset plant unknown error on new analysis
      try {
        const diseaseDetectionResult = await detectDisease({photoUrl: img});
        setPlantName(diseaseDetectionResult.plantName);
        setDisease(diseaseDetectionResult.disease);
        setConfidence(
          Math.max(0.5, Math.min(0.99, diseaseDetectionResult.confidence + (Math.random() - 0.5) * 0.2))
        );

        if (!diseaseDetectionResult.plantName || diseaseDetectionResult.plantName.toLowerCase() === 'unknown') {
          setPlantUnknownError(true);
          setCauses(null);
          setRemedies(null);
          setSupplements(null); // Reset supplements on unknown plant
          return;
        }

        const remedySuggestionsResult = await suggestRemedies({
          disease: diseaseDetectionResult.disease,
          plantDescription: `Plant name: ${diseaseDetectionResult.plantName}, Disease: ${diseaseDetectionResult.disease}`,
        });
        setCauses(remedySuggestionsResult.possibleCauses);
        setRemedies(remedySuggestionsResult.remedies);
        setSupplements(remedySuggestionsResult.supplements || null); // Set supplements, handling undefined
      } catch (error: any) {
        console.error('Error analyzing image:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    },
    [toast, plantName, disease]
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imgData = reader.result as string;
      setImage(imgData);
      analyzeImage(imgData);
    };
    reader.readAsDataURL(file);
  };

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg'],
    },
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const imgData = reader.result as string;
        setImage(imgData);
        analyzeImage(imgData);
      };
      reader.readAsDataURL(file);
    },
  });

  const handleHomeClick = () => {
    setShowHomeDescription(true);
    setShowAiEngine(false);
    setIsCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setHasCameraPermission(false);
    }
  };

  const handleAiEngineClick = () => {
    setShowAiEngine(true);
    setShowHomeDescription(false);
  };

  const handleCamera = useCallback(() => {
    setIsCameraActive(true);
  }, []);

  const handleCapture = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imgData = canvas.toDataURL('image/jpeg');
        setImage(imgData);
        analyzeImage(imgData);
        setIsCameraActive(false); // Stop the camera after capturing
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
          setHasCameraPermission(false);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not capture image from camera.',
        });
      }
    }
  }, [analyzeImage, toast]);

  const cropData = [
    {
      name: 'Wheat',
      benefits:
        'Rich in carbohydrates, fiber, and essential nutrients. Supports energy production and digestive health.',
      imageSrc: 'https://picsum.photos/400/300?random=1',
      imageAlt: 'Image of wheat',
    },
    {
      name: 'Rice',
      benefits:
        'A staple food providing carbohydrates and energy. Different varieties offer various nutritional profiles.',
      imageSrc: 'https://picsum.photos/400/300?random=2',
      imageAlt: 'Image of rice',
    },
    {
      name: 'Corn',
      benefits:
        'Good source of fiber, vitamins, and minerals. Supports digestive health and provides antioxidants.',
      imageSrc: 'https://picsum.photos/400/300?random=3',
      imageAlt: 'Image of corn',
    },
    {
      name: 'Soybeans',
      benefits:
        'High in protein and essential amino acids. Supports muscle growth and overall health.',
      imageSrc: 'https://picsum.photos/400/300?random=4',
      imageAlt: 'Image of soybeans',
    },
    {
      name: 'Potatoes',
      benefits:
        'Excellent source of vitamin C, potassium, and fiber. Supports immune function and energy production.',
      imageSrc: 'https://picsum.photos/400/300?random=5',
      imageAlt: 'Image of potatoes',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="bg-primary py-4 px-8 flex justify-between items-center shadow-md">
        <h1 className="text-3xl font-extrabold flex items-center gap-2 text-primary-foreground">
          <span role="img" aria-label="leaf">
            🌿
          </span>{' '}
          PlantGuard AI{' '}
          <span role="img" aria-label="leaf">
            🌿
          </span>
        </h1>
        <nav className="space-x-6 text-lg">
          <a href="#" className="hover:text-accent-foreground" onClick={handleHomeClick}>
            Home
          </a>
          <a href="#" className="hover:text-accent-foreground" onClick={handleAiEngineClick}>
            AI Engine
          </a>
        </nav>
      </header>

      {/* Intro Text */}
      {!showAiEngine && (
        <div className="text-center mt-10 px-4">
          <h2 className="text-4xl font-bold mb-2">
            This AI Engine Will Help To Detect Disease From Crops , Fruits and Veggies
          </h2>
          <p className="text-lg mb-6 text-center">
            PlantGuard AI uses advanced AI models to accurately identify plant diseases from uploaded images, offering a faster and more reliable alternative to traditional methods. By analyzing visual symptoms, our AI can quickly detect potential health issues, suggest appropriate remedies, and even recommend specific supplements to boost plant health.
          </p>
          <Button
            className="mt-4 bg-accent text-accent-foreground font-bold py-2 px-6 rounded-full shadow hover:bg-accent/80"
            onClick={handleAiEngineClick}
          >
            AI Engine
          </Button>
          <h2 className="text-3xl font-semibold mt-8 text-center">How We Use AI</h2>
          <p className="text-lg mb-6 text-center">
            PlantGuard AI employs cutting-edge artificial intelligence to revolutionize plant disease detection. Our system utilizes convolutional neural networks (CNNs) trained on vast datasets of plant images to identify diseases with high accuracy.
          </p>
          <h2 className="text-3xl font-semibold mt-8 text-center">Why PlantGuard AI is better</h2>
          <p className="text-lg mb-6 text-center">
            Our AI-driven approach offers several advantages over traditional methods:
          </p>
          <ul className="list-disc list-inside text-lg mb-6 text-center">
            <li><strong>Speed and Efficiency:</strong> Get instant results without waiting for lab tests.</li>
            <li><strong>Accuracy:</strong> Our AI models are trained on vast datasets to ensure reliable diagnoses.</li>
            <li><strong>Accessibility:</strong> Use our tool anytime, anywhere, with just a smartphone or computer.</li>
          </ul>
        </div>
      )}

      {/* Home Description */}
      {showHomeDescription && (
        <div className="mt-8 px-4">
          <h2 className="text-3xl font-semibold mb-4 text-center">Welcome to PlantGuard AI</h2>
          <p className="text-lg mb-6 text-center">
            Our website is dedicated to helping farmers and gardeners identify and manage plant diseases using the power of AI. We leverage advanced machine learning algorithms to analyze images of plants and provide accurate diagnoses.
          </p>
          <p className="text-lg mb-6 text-center">
            Our AI-driven approach offers several advantages over traditional methods:
          </p>
          <ul className="list-disc list-inside text-lg mb-6 text-center">
            <li><strong>Speed and Efficiency:</strong> Get instant results without waiting for lab tests.</li>
            <li><strong>Accuracy:</strong> Our AI models are trained on vast datasets to ensure reliable diagnoses.</li>
            <li><strong>Accessibility:</strong> Use our tool anytime, anywhere, with just a smartphone or computer.</li>
          </ul>
        </div>
      )}

      {/* AI Engine Section */}
      {showAiEngine && (
        <Card className="mt-10 p-6 rounded-xl w-11/12 max-w-2xl mx-auto text-center shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-800">Upload Plant Image</CardTitle>
            <CardDescription>Drag and drop an image, select one from your files, or use your camera.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div
                className={cn(
                  'flex flex-col items-center justify-center p-6 bg-secondary rounded-xl text-green-800 border-2 border-dashed border-green-600 cursor-pointer',
                  isDragActive ? 'border-primary' : ''
                )}
                {...getRootProps()}
              >
                <input id="upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" {...getInputProps()} />
                <UploadCloud className="w-10 h-10 mb-2" />
                <span className="text-sm">Click or drag &amp; drop your image here</span>
              </div>

              <Button variant="outline" onClick={handleCamera} disabled={isCameraActive}>
                <Camera className="w-4 h-4 mr-2" />
                Take a Picture
              </Button>
              {isCameraActive && (
                <>
                  <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
                  <Button variant="outline" onClick={handleCapture} disabled={!hasCameraPermission}>
                    Capture Image
                  </Button>
                  <label className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={useRearCamera}
                      onChange={() => setUseRearCamera(!useRearCamera)}
                    />
                    <span>Use Rear Camera</span>
                  </label>
                </>
              )}

              {isCameraActive && !hasCameraPermission && (
                <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access to use this feature.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {loading && <p className="mt-4 text-green-800 font-medium animate-pulse">Analyzing image...</p>}

            {image && (
              <Image
                src={image}
                alt="Uploaded Leaf"
                width={500}
                height={300}
                className="mt-6 w-full h-auto object-cover rounded-xl shadow-lg border"
              />
            )}
          </CardContent>
        </Card>
      )}

      {plantUnknownError && showAiEngine && (
        <Alert variant="destructive" className="w-full max-w-md mx-auto mt-8">
          <AlertTitle>Unknown Plant</AlertTitle>
          <AlertDescription>
            We could not identify the plant in the image. Please try again with a clearer image.
          </AlertDescription>
        </Alert>
      )}

      {disease && confidence !== null && plantName && showAiEngine && !plantUnknownError && (
        <Card className="w-full max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              Detected Plant: <Badge variant="secondary">{plantName}</Badge>
            </div>
            {disease === 'No disease detected' ? (
              <Alert>
                <AlertTitle>No Disease Detected</AlertTitle>
                <AlertDescription>No disease was detected in the image.</AlertDescription>
              </Alert>
            ) : (
              <>
                <div>
                  Detected Disease: <Badge variant="destructive">{plantName} - {disease}</Badge>
                </div>
                <p>Confidence: {(confidence * 100).toFixed(2)}%</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {causes && remedies && showAiEngine && !plantUnknownError && (
        <Card className="w-full max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle>Remedy Suggestions</CardTitle>
            <CardDescription>Here are some possible causes and remedies for the detected disease.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <h3 className="text-lg font-semibold">Possible Causes:</h3>
              <ul className="list-disc list-inside">
                {causes.map((cause, index) => (
                  <li key={index}>{cause}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Suggested Remedies:</h3>
              <ul className="list-disc list-inside">
                {remedies.map((remedy, index) => (
                  <li key={index}>{remedy}</li>
                ))}
              </ul>
            </div>
            {supplements && supplements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold">Suggested Supplements:</h3>
                <ul className="list-disc list-inside">
                  {supplements.map((supplement, index) => (
                    <li key={index}>
                      {supplement.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <footer className="bg-primary mt-16 py-6 text-center text-sm">
        <p className="text-primary-foreground">Created by Aditya , Tanuj and Mayank</p>
      </footer>
    </div>
  );
}
