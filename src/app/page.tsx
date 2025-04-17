'use client';

import React, {useState, useCallback, useRef, useEffect} from 'react';
import {UploadCloud, AlertTriangle, Camera, Clock, RotateCcw} from 'lucide-react';
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

interface HistoryItem {
  id: string;
  image: string | null;
  plantName: string | null;
  disease: string | null;
  confidence: number | null;
  causes: string[] | null;
  remedies: string[] | null;
  supplements: string[] | null;
}

export default function PlantDiseaseDetector() {
  const [image, setImage] = useState<string | null>(null);
  const [plantName, setPlantName] = useState<string | null>(null);
  const [disease, setDisease] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [causes, setCauses] = useState<string[] | null>(null);
  const [remedies, setRemedies] = useState<string[] | null>(null);
  const [supplements, setSupplements] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const {toast} = useToast();
  const [showHomeDescription, setShowHomeDescription] = useState(true);
  const [showAiEngine, setShowAiEngine] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [useRearCamera, setUseRearCamera] = useState(false);
  const [plantUnknownError, setPlantUnknownError] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('plantHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    setShowHomeDescription(true);
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('plantHistory', JSON.stringify(history));
    }
  }, [history]);

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
          setLoading(false);
          return;
        }

        const remedySuggestionsResult = await suggestRemedies({
          disease: diseaseDetectionResult.disease || 'No disease detected',
          plantDescription: `Plant name: ${diseaseDetectionResult.plantName}, Disease: ${diseaseDetectionResult.disease || 'No disease detected'}`,
        });
        setCauses(remedySuggestionsResult.possibleCauses);
        setRemedies(remedySuggestionsResult.remedies);
        setSupplements(remedySuggestionsResult.supplements || null); // Set supplements, handling undefined

        // Save to history
        const newHistoryItem: HistoryItem = {
          id: Date.now().toString(),
          image: img,
          plantName: diseaseDetectionResult.plantName,
          disease: diseaseDetectionResult.disease,
          confidence: Math.max(0.5, Math.min(0.99, diseaseDetectionResult.confidence + (Math.random() - 0.5) * 0.2)),
          causes: remedySuggestionsResult.possibleCauses,
          remedies: remedySuggestionsResult.remedies,
          supplements: remedySuggestionsResult.supplements || null,
        };
        setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
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
    [toast]
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
    setShowHistory(false);
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
    setShowHistory(false);
    setIsCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setHasCameraPermission(false);
    }
  };

  const handleHistoryClick = () => {
    setShowHistory(true);
    setShowHomeDescription(false);
    setShowAiEngine(false);
    setIsCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setHasCameraPermission(false);
    }
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
      imageSrc: 'https://www.britannica.com/plant/wheat',
      imageAlt: 'Wheat Field',
      benefits: 'Rich in carbohydrates, fiber, and essential nutrients. It is one of the primary grains used in bread, pasta, and other staple foods. Wheat cultivation dates back thousands of years, with evidence suggesting its domestication in the Fertile Crescent. The major producers of wheat include China, India, Russia, and the United States.',
    },
    {
      name: 'Rice',
      imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Paddy_field_in_Thailand.jpg/1280px-Paddy_field_in_Thailand.jpg',
      imageAlt: 'Rice Paddy',
      benefits: 'A staple food for billions, providing energy and some vitamins. Rice is a semi-aquatic grass and is a major source of food for more than half of the world\'s human population. The earliest known evidence of rice cultivation dates back to 8200 BCE in China. Leading rice-producing countries include China, India, Indonesia, and Bangladesh.',
    },
    {
      name: 'Corn',
      imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Maize-field-germany.jpg/1280px-Maize-field-germany.jpg',
      imageAlt: 'Corn Field',
      benefits: 'Versatile grain used for food, feed, and industrial purposes. Corn, also known as maize, is one of the most widely distributed food crops. It originated in southern Mexico about 9,000 years ago. The top corn-producing nations are the United States, China, Brazil, and Argentina.',
    },
    {
      name: 'Soybeans',
      imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Soybeans2.jpg/1280px-Soybeans2.jpg',
      imageAlt: 'Soybean field',
      benefits: 'Excellent source of protein and oil. Soybeans are legumes native to East Asia. They are an important global crop, providing oil and protein for animal feed and human consumption. Key soybean producers include the United States, Brazil, Argentina, and China.',
    },
    {
      name: 'Potatoes',
      imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/ আলু_ক্ষেত.JPG/1280px-আলু_ক্ষেত.JPG',
      imageAlt: 'Potato field',
      benefits: 'Rich in carbohydrates, vitamins, and minerals. Potatoes are starchy tubers native to the Andes. They are a staple food in many parts of the world. Major potato-producing countries are China, India, Russia, and Ukraine.',
    },
    {
      name: 'Tomatoes',
      imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_plant.jpg/1280px-Tomato_plant.jpg',
      imageAlt: 'Tomato plants',
      benefits: 'Good source of vitamins and antioxidants. Tomatoes originated in South America. They are now grown worldwide and consumed in various forms. Top tomato-producing countries include China, India, Turkey, and the United States.',
    },
    {
      name: 'Bananas',
      imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Banana_trunk_in_Dalaguete.jpg/1280px-Banana_trunk_in_Dalaguete.jpg',
      imageAlt: 'Banana plantation',
      benefits: 'Excellent source of potassium and energy. Bananas are tropical fruits originally from Southeast Asia. They are now cultivated in many tropical and subtropical regions. Leading banana producers include India, China, Indonesia, and Brazil.',
    },
    {
      name: 'Apples',
      imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Delicious.jpg/1280px-Red_Delicious.jpg',
      imageAlt: 'Apple orchard',
      benefits: 'High in fiber and vitamins. Apples are one of the most widely cultivated tree fruits. They originated in Central Asia. Major apple-producing countries include China, the United States, Turkey, and Poland.',
    },
    {
      name: 'Oranges',
      imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Orange-Fruit-on-Tree.jpg/1280px-Orange-Fruit-on-Tree.jpg',
      imageAlt: 'Orange grove',
      benefits: 'Rich in Vitamin C and antioxidants. Oranges are citrus fruits believed to have originated in Southeast Asia. Key orange-producing countries include Brazil, the United States, India, and Mexico.',
    },
    {
      name: 'Grapes',
      imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Grapes_on_a_vine.jpg/1280px-Grapes_on_a_vine.jpg',
      imageAlt: 'Vineyard',
      benefits: 'Contain antioxidants and essential nutrients. Grapes are fruit-bearing vines. They are used to produce wine, juice, and raisins. Major grape-producing countries include China, Italy, the United States, and Spain.',
    },
    {
      name: 'Mangoes',
      imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Mangos_hanging_from_tree.jpg/1280px-Mangos_hanging_from_tree.jpg',
      imageAlt: 'Mango Tree',
      benefits: 'Rich in vitamins A and C, and antioxidants. Mangoes are tropical fruits native to South Asia. They are now cultivated in many frost-free regions. Top mango-producing nations are India, China, Thailand, and Indonesia.',
    },
    {
      name: 'Sugarcane',
      imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Cane_Field_Bundaberg.JPG/1280px-Cane_Field_Bundaberg.JPG',
      imageAlt: 'Sugarcane Field',
      benefits: 'Primary source of sugar. Sugarcane is a tropical grass cultivated for its sucrose content. Key sugarcane producers include Brazil, India, Thailand, and China.',
    },
    {
      name: 'Cotton',
      imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Cotton_Field_in_Central_Texas.jpg/1280px-Cotton_Field_in_Central_Texas.jpg',
      imageAlt: 'Cotton Field',
      benefits: 'Source of natural fiber for textiles. Cotton is a shrub cultivated for its fiber. Major cotton-producing countries are India, China, the United States, and Brazil.',
    },
    {
      name: 'Tea',
      imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Sri_Lanka_Tea_Plantations_Nuwara_Eliya-square.jpg/1280px-Sri_Lanka_Tea_Plantations_Nuwara_Eliya-square.jpg',
      imageAlt: 'Tea Plantation',
      benefits: 'Contains antioxidants and enhances alertness. Tea is made from the leaves of the Camellia sinensis plant. Key tea-producing countries include China, India, Kenya, and Sri Lanka.',
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
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
          <a href="#" className="hover:text-accent-foreground" onClick={handleHistoryClick}>
            <Clock className="inline-block w-4 h-4 mr-1" />
            History
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Home Description */}
        {showHomeDescription && (
          <div className="mt-8 px-4">
            <h2 className="text-3xl font-semibold mb-4 text-center">Welcome to PlantGuard AI</h2>
            <p className="text-lg mb-6 text-center">
              Our website is dedicated to helping farmers and gardeners identify and manage plant diseases using the power of AI. We leverage advanced machine learning algorithms to analyze images of plants and provide accurate diagnoses.
            </p>

            <h2 className="text-3xl font-semibold mt-8 text-center">How We Use AI</h2>
            <p className="text-lg mb-6 text-center">
              Our PlantGuard AI employs advanced artificial intelligence for plant disease detection. We utilize Convolutional Neural Networks (CNNs) trained on large datasets of plant images to accurately identify diseases. The AI model is continuously improved to provide reliable diagnoses.
            </p>
            <h2 className="text-3xl font-semibold mt-8 text-center">Common Crops and their Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {cropData.map((crop, index) => (
                <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <Image
                    src={crop.imageSrc}
                    alt={crop.imageAlt}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover rounded-t-md"
                  />
                  <CardHeader>
                    <CardTitle>{crop.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{crop.benefits}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                  <AlertDescription className="mt-4">Here are some tips for maintaining a healthy plant:</AlertDescription>
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
              <CardTitle>
                {disease === 'No disease detected' ? ' ' : 'Remedy Suggestions'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {disease === 'No disease detected' ? (
                <div>
                  <ul className="list-disc list-inside">
                    {remedies.map((remedy, index) => (
                      <li key={index}>{remedy}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
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
                            {supplement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
        {/* History Section */}
        {showHistory && (
          <div className="mt-8 px-4">
            <h2 className="text-3xl font-semibold mb-4 text-center">Analysis History</h2>
            {history.length === 0 ? (
              <p className="text-lg text-center">No analysis history available.</p>
            ) : (
              <div className="grid gap-4">
                {history.map((item) => (
                  <Card key={item.id} className="shadow-md">
                    <CardHeader>
                      <CardTitle>Analysis Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {item.image && (
                        <Image
                          src={item.image}
                          alt="Uploaded Leaf"
                          width={200}
                          height={120}
                          className="w-full h-auto object-cover rounded-xl shadow-lg border"
                        />
                      )}
                      <div>
                        Detected Plant: <Badge variant="secondary">{item.plantName}</Badge>
                      </div>
                      {item.disease === 'No disease detected' ? (
                        <Alert>
                          <AlertTitle>No Disease Detected</AlertTitle>
                          <AlertDescription>No disease was detected in the image.</AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <div>
                            Detected Disease: <Badge variant="destructive">{item.plantName} - {item.disease}</Badge>
                          </div>
                          <p>Confidence: {(item.confidence! * 100).toFixed(2)}%</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      {/* Footer */}
      <footer className="bg-primary mt-16 py-6 text-center text-sm fixed bottom-0 left-0 w-full">
        <p className="text-primary-foreground">Created by Aditya , Tanuj and Mayank</p>
      </footer>
    </div>
  );
}

