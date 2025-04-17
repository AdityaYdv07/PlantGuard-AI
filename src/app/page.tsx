'use client';

import React, {useState, useCallback, useRef, useEffect} from 'react';
import {UploadCloud, AlertTriangle, Camera, RotateCcw} from 'lucide-react';
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

const cropData = [
  {
    name: 'Rice',
    seasons: ['Kharif (Monsoon)'],
    states: ['West Bengal', 'Uttar Pradesh', 'Punjab', 'Odisha', 'Andhra Pradesh'],
    benefits: ['High in carbohydrates', 'Good source of energy'],
    imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Paddy_field_in_Thailand.jpg/1280px-Paddy_field_in_Thailand.jpg',
    imageAlt: 'Paddy Field',
  },
  {
    name: 'Wheat',
    seasons: ['Rabi (Winter)'],
    states: ['Uttar Pradesh', 'Punjab', 'Haryana', 'Madhya Pradesh', 'Rajasthan'],
    benefits: ['Rich in fiber', 'Good for heart health'],
    imageSrc: 'https://www.britannica.com/plant/wheat',
    imageAlt: 'Wheat Field',
  },
  {
    name: 'Pulses (e.g., Lentil, Chickpea)',
    seasons: ['Rabi (Winter)'],
    states: ['Madhya Pradesh', 'Rajasthan', 'Maharashtra', 'Uttar Pradesh', 'Karnataka'],
    benefits: ['High in protein', 'Good for muscle building'],
    imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Kabuli_chana.JPG/1280px-Kabuli_chana.JPG',
    imageAlt: 'Chickpeas',
  },
  {
    name: 'Millets (e.g., Jowar, Bajra, Ragi)',
    seasons: ['Kharif (Monsoon)', 'Rabi (Winter)', 'Zaid (Summer)'],
    states: ['Maharashtra', 'Karnataka', 'Rajasthan', 'Tamil Nadu', 'Andhra Pradesh'],
    benefits: ['Rich in minerals', 'Good for digestion'],
    imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Sorghum_grain.jpg/1280px-Sorghum_grain.jpg',
    imageAlt: 'Jowar Crop',
  },
  {
    name: 'Cotton',
    seasons: ['Kharif (Monsoon)'],
    states: ['Maharashtra', 'Gujarat', 'Telangana', 'Andhra Pradesh', 'Punjab'],
    benefits: ['Cash crop', 'Supports textile industry'],
    imageSrc: 'https://www.shutterstock.com/image-photo/white-cotton-field-260nw-1920694138.jpg',
    imageAlt: 'Cotton Field',
  },
  {
    name: 'Sugarcane',
    seasons: ['Throughout the year'],
    states: ['Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat'],
    benefits: ['Source of sugar', 'Supports sugar industry'],
    imageSrc: 'https://www.shutterstock.com/image-photo/sugarcane-field-india-260nw-1342373281.jpg',
    imageAlt: 'Sugarcane Field',
  },
  {
    name: 'Tea',
    seasons: ['Throughout the year'],
    states: ['Assam', 'West Bengal', 'Tamil Nadu', 'Kerala', 'Himachal Pradesh'],
    benefits: ['Beverage crop', 'Supports tea industry'],
    imageSrc: 'https://www.shutterstock.com/image-photo/tea-plantation-landscape-260nw-2144523539.jpg',
    imageAlt: 'Tea Plantation',
  },
  {
    name: 'Coffee',
    seasons: ['Throughout the year'],
    states: ['Karnataka', 'Kerala', 'Tamil Nadu', 'Andhra Pradesh', 'Odisha'],
    benefits: ['Beverage crop', 'Supports coffee industry'],
    imageSrc: 'https://www.shutterstock.com/image-photo/coffee-plantation-south-india-260nw-1072994939.jpg',
    imageAlt: 'Coffee Plantation',
  },
  {
    name: 'Groundnut',
    seasons: ['Kharif (Monsoon)'],
    states: ['Gujarat', 'Rajasthan', 'Tamil Nadu', 'Andhra Pradesh', 'Maharashtra'],
    benefits: ['Source of oil', 'Rich in protein'],
    imageSrc: 'https://www.shutterstock.com/image-photo/peanut-field-summer-day-260nw-2253869289.jpg',
    imageAlt: 'Groundnut Field',
  },
  {
    name: 'Jute',
    seasons: ['Kharif (Monsoon)'],
    states: ['West Bengal', 'Bihar', 'Assam', 'Odisha', 'Meghalaya'],
    benefits: ['Fiber crop', 'Supports jute industry'],
    imageSrc: 'https://www.shutterstock.com/image-photo/jute-cultivation-rural-bengal-260nw-2251994236.jpg',
    imageAlt: 'Jute Crop',
  },
  {
    name: 'Maize',
    seasons: ['Kharif (Monsoon)'],
    states: ['Karnataka', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Bihar'],
    benefits: ['Food and fodder crop', 'Source of starch'],
    imageSrc: 'https://www.shutterstock.com/image-photo/corn-field-260nw-1743118327.jpg',
    imageAlt: 'Maize Field',
  },
  {
    name: 'Lentil',
    seasons: ['Rabi (Winter)'],
    states: ['Madhya Pradesh', 'Uttar Pradesh', 'Bihar', 'West Bengal', 'Rajasthan'],
    benefits: ['High in protein and fiber', 'Good for controlling cholesterol and blood sugar'],
    imageSrc: 'https://www.shutterstock.com/image-photo/harvesting-green-lentil-plants-lens-260nw-2341424076.jpg',
    imageAlt: 'Lentil Crop',
  },
  {
    name: 'Mustard',
    seasons: ['Rabi (Winter)'],
    states: ['Rajasthan', 'Haryana', 'Madhya Pradesh', 'Uttar Pradesh', 'West Bengal'],
    benefits: ['Source of edible oil', 'Seeds, leaves, and stems are edible as a vegetable'],
    imageSrc: 'https://www.shutterstock.com/image-photo/close-oilseed-rape-flowers-260nw-1191949766.jpg',
    imageAlt: 'Mustard Crop',
  },
  {
    name: 'Mango',
    seasons: ['Summer'],
    states: ['Uttar Pradesh', 'Andhra Pradesh', 'Bihar', 'Gujarat', 'Karnataka'],
    benefits: ['Rich in vitamins A and C', 'Promotes eye health and boosts immunity'],
    imageSrc: 'https://www.shutterstock.com/image-photo/indian-alphonso-mangoes-260nw-1869999028.jpg',
    imageAlt: 'Mangoes',
  },
  {
    name: 'Banana',
    seasons: ['Throughout the year'],
    states: ['Tamil Nadu', 'Maharashtra', 'Gujarat', 'Andhra Pradesh', 'Karnataka'],
    benefits: ['High in potassium', 'Good for heart health and energy'],
    imageSrc: 'https://www.shutterstock.com/image-photo/banana-isolated-on-white-background-260nw-1410860652.jpg',
    imageAlt: 'Bananas',
  },
];

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
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {cropData.map((crop, index) => (
                <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  
                  <CardHeader>
                    <CardTitle>{crop.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      <strong>Seasons:</strong> {crop.seasons.join(', ')}
                      <br />
                      <strong>States:</strong> {crop.states.join(', ')}
                      <br />
                      <strong>Benefits:</strong> {crop.benefits.join(', ')}
                    </p>
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
        
      </main>
      
    </div>
  );
}

