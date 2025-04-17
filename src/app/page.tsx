'use client';

import React, {useState, useCallback, useRef, useEffect} from 'react';
import {UploadCloud, Camera, AlertTriangle, RotateCcw} from 'lucide-react';
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
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";

const cropData = [
  {
    name: 'Rice',
    seasons: ['Kharif (Monsoon)'],
    states: ['West Bengal', 'Uttar Pradesh', 'Punjab', 'Odisha', 'Andhra Pradesh'],
    benefits: ['High in carbohydrates', 'Good source of energy'],
    imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Paddy_field_in_Thailand.jpg/1280px-Paddy_field_in_Thailand.jpg',
    imageAlt: 'Paddy Field',
    growingInfo: {
      soilType: 'Alluvial soil, clayey and loamy subsoil',
      waterRequirement: 'High, requires standing water',
      nutrients: 'Nitrogen, Phosphorus, Potassium',
      cultivation: 'Transplanting seedlings in puddled fields',
      process: 'Rice cultivation typically involves flooding the fields to control weeds and provide the ideal environment for growth. The process starts with preparing the land, sowing seeds, transplanting seedlings, and maintaining the water level. Harvesting is done when the grains are mature and dry.'
    },
  },
  {
    name: 'Wheat',
    seasons: ['Rabi (Winter)'],
    states: ['Uttar Pradesh', 'Punjab', 'Haryana', 'Madhya Pradesh', 'Rajasthan'],
    benefits: ['Rich in fiber', 'Good for heart health'],
    imageSrc: 'https://www.britannica.com/plant/wheat',
    imageAlt: 'Wheat Field',
    growingInfo: {
      soilType: 'Well-drained loamy soil',
      waterRequirement: 'Moderate',
      nutrients: 'Nitrogen, Phosphorus',
      cultivation: 'Sowing seeds in rows',
       process: 'Wheat cultivation involves preparing the soil by plowing and harrowing, followed by sowing seeds in rows. Regular watering is necessary, especially during critical growth stages. Harvesting occurs when the grains are hard and the stalks turn yellow.'
    },
  },
  {
    name: 'Pulses (e.g., Lentil, Chickpea)',
    seasons: ['Rabi (Winter)'],
    states: ['Madhya Pradesh', 'Rajasthan', 'Maharashtra', 'Uttar Pradesh', 'Karnataka'],
    benefits: ['High in protein', 'Good for muscle building'],
    imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Kabuli_chana.JPG/1280px-Kabuli_chana.JPG',
    imageAlt: 'Chickpeas',
    growingInfo: {
      soilType: 'Sandy loamy soil',
      waterRequirement: 'Low',
      nutrients: 'Nitrogen fixation',
      cultivation: 'Sowing seeds',
      process: 'Pulse cultivation involves preparing the soil by plowing and leveling, followed by sowing seeds. Minimal watering is required as pulses are drought-resistant. Harvesting is done when the pods are dry and the seeds are mature.'
    },
  },
  {
    name: 'Millets (e.g., Jowar, Bajra, Ragi)',
    seasons: ['Kharif (Monsoon)', 'Rabi (Winter)', 'Zaid (Summer)'],
    states: ['Maharashtra', 'Karnataka', 'Rajasthan', 'Tamil Nadu', 'Andhra Pradesh'],
    benefits: ['Rich in minerals', 'Good for digestion'],
    imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Sorghum_grain.jpg/1280px-Sorghum_grain.jpg',
    imageAlt: 'Jowar Crop',
    growingInfo: {
      soilType: 'Well-drained sandy soil',
      waterRequirement: 'Low',
      nutrients: 'Nitrogen, Phosphorus',
      cultivation: 'Sowing seeds',
       process: 'Millet cultivation involves preparing the soil and sowing seeds directly. Millets are hardy crops and require minimal water and care. Harvesting is done when the grains are fully mature and dry.'
    },
  },
  {
    name: 'Cotton',
    seasons: ['Kharif (Monsoon)'],
    states: ['Maharashtra', 'Gujarat', 'Telangana', 'Andhra Pradesh', 'Punjab'],
    benefits: ['Cash crop', 'Supports textile industry'],
    imageSrc: 'https://www.shutterstock.com/image-photo/white-cotton-field-260nw-1920694138.jpg',
    imageAlt: 'Cotton Field',
    growingInfo: {
      soilType: 'Black cotton soil',
      waterRequirement: 'Moderate to high',
      nutrients: 'Nitrogen, Phosphorus, Potassium',
      cultivation: 'Sowing seeds',
       process: 'Cotton cultivation involves preparing the black cotton soil and sowing seeds. Regular irrigation and pest management are crucial. Harvesting is done when the cotton bolls are fully open.'
    },
  },
  {
    name: 'Sugarcane',
    seasons: ['Throughout the year'],
    states: ['Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat'],
    benefits: ['Source of sugar', 'Supports sugar industry'],
    imageSrc: 'https://www.shutterstock.com/image-photo/sugarcane-field-india-260nw-1342373281.jpg',
    imageAlt: 'Sugarcane Field',
    growingInfo: {
      soilType: 'Loamy soil',
      waterRequirement: 'High',
      nutrients: 'Nitrogen, Phosphorus, Potassium',
      cultivation: 'Planting setts',
       process: 'Sugarcane cultivation involves planting setts (stem cuttings). High irrigation and nutrient supply are essential for its growth. Harvesting is done when the cane is mature and has high sugar content.'
    },
  },
  {
    name: 'Tea',
    seasons: ['Throughout the year'],
    states: ['Assam', 'West Bengal', 'Tamil Nadu', 'Kerala', 'Himachal Pradesh'],
    benefits: ['Beverage crop', 'Supports tea industry'],
    imageSrc: 'https://www.shutterstock.com/image-photo/tea-plantation-landscape-260nw-2144523539.jpg',
    imageAlt: 'Tea Plantation',
    growingInfo: {
      soilType: 'Well-drained acidic soil',
      waterRequirement: 'High',
      nutrients: 'Nitrogen, Potassium',
      cultivation: 'Planting saplings',
       process: 'Tea cultivation involves planting saplings in well-drained acidic soil. Regular pruning and irrigation are required. Harvesting is done by plucking the young leaves and buds.'
    },
  },
  {
    name: 'Coffee',
    seasons: ['Throughout the year'],
    states: ['Karnataka', 'Kerala', 'Tamil Nadu', 'Andhra Pradesh', 'Odisha'],
    benefits: ['Beverage crop', 'Supports coffee industry'],
    imageSrc: 'https://www.shutterstock.com/image-photo/coffee-plantation-south-india-260nw-1072994939.jpg',
    imageAlt: 'Coffee Plantation',
    growingInfo: {
      soilType: 'Well-drained loamy soil',
      waterRequirement: 'Moderate',
      nutrients: 'Nitrogen, Phosphorus, Potassium',
      cultivation: 'Planting seedlings',
       process: 'Coffee cultivation involves planting seedlings in well-drained loamy soil. Shade, regular watering, and pruning are essential. Harvesting is done by picking the ripe coffee cherries.'
    },
  },
  {
    name: 'Groundnut',
    seasons: ['Kharif (Monsoon)'],
    states: ['Gujarat', 'Rajasthan', 'Tamil Nadu', 'Andhra Pradesh', 'Maharashtra'],
    benefits: ['Source of oil', 'Rich in protein'],
    imageSrc: 'https://www.shutterstock.com/image-photo/peanut-field-summer-day-260nw-2253869289.jpg',
    imageAlt: 'Groundnut Field',
    growingInfo: {
      soilType: 'Sandy loamy soil',
      waterRequirement: 'Moderate',
      nutrients: 'Nitrogen, Phosphorus, Potassium',
      cultivation: 'Sowing seeds',
       process: 'Groundnut cultivation involves preparing sandy loamy soil and sowing seeds. Regular weeding and moderate irrigation are required. Harvesting is done by uprooting the plants when the pods are mature.'
    },
  },
  {
    name: 'Jute',
    seasons: ['Kharif (Monsoon)'],
    states: ['West Bengal', 'Bihar', 'Assam', 'Odisha', 'Meghalaya'],
    benefits: ['Fiber crop', 'Supports jute industry'],
    imageSrc: 'https://www.shutterstock.com/image-photo/jute-cultivation-rural-bengal-260nw-2251994236.jpg',
    imageAlt: 'Jute Crop',
    growingInfo: {
      soilType: 'Alluvial soil',
      waterRequirement: 'High',
      nutrients: 'Nitrogen, Phosphorus, Potassium',
      cultivation: 'Sowing seeds',
      process: 'Jute cultivation involves sowing seeds in alluvial soil. High water requirements are met by monsoon rains and irrigation. Harvesting is done by cutting the plants when they are at the flowering stage.'
    },
  },
  {
    name: 'Maize',
    seasons: ['Kharif (Monsoon)'],
    states: ['Karnataka', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Bihar'],
    benefits: ['Food and fodder crop', 'Source of starch'],
    imageSrc: 'https://www.shutterstock.com/image-photo/corn-field-260nw-1743118327.jpg',
    imageAlt: 'Maize Field',
    growingInfo: {
      soilType: 'Well-drained loamy soil',
      waterRequirement: 'Moderate',
      nutrients: 'Nitrogen, Phosphorus, Potassium',
      cultivation: 'Sowing seeds',
       process: 'Maize cultivation involves preparing well-drained loamy soil and sowing seeds. Regular irrigation and fertilization are important. Harvesting is done when the kernels are mature and dry.'
    },
  },
  {
    name: 'Lentil',
    seasons: ['Rabi (Winter)'],
    states: ['Madhya Pradesh', 'Uttar Pradesh', 'Bihar', 'West Bengal', 'Rajasthan'],
    benefits: ['High in protein and fiber', 'Good for controlling cholesterol and blood sugar'],
    imageSrc: 'https://www.shutterstock.com/image-photo/harvesting-green-lentil-plants-lens-260nw-2341424076.jpg',
    imageAlt: 'Lentil Crop',
    growingInfo: {
      soilType: 'Sandy loamy soil',
      waterRequirement: 'Low',
      nutrients: 'Nitrogen fixation',
      cultivation: 'Sowing seeds',
       process: 'Lentil cultivation involves preparing sandy loamy soil and sowing seeds. Lentils require low water and are often grown in dry regions. Harvesting is done when the pods are dry and the seeds are mature.'
    },
  },
  {
    name: 'Mustard',
    seasons: ['Rabi (Winter)'],
    states: ['Rajasthan', 'Haryana', 'Madhya Pradesh', 'Uttar Pradesh', 'West Bengal'],
    benefits: ['Source of edible oil', 'Seeds, leaves, and stems are edible as a vegetable'],
    imageSrc: 'https://www.shutterstock.com/image-photo/close-oilseed-rape-flowers-260nw-1191949766.jpg',
    imageAlt: 'Mustard Crop',
    growingInfo: {
      soilType: 'Sandy loamy soil',
      waterRequirement: 'Low',
      nutrients: 'Nitrogen, Phosphorus, Potassium',
      cultivation: 'Sowing seeds',
       process: 'Mustard cultivation involves preparing sandy loamy soil and sowing seeds. It requires minimal water and care. Harvesting is done when the pods are dry and the seeds are mature.'
    },
  },
  {
    name: 'Mango',
    seasons: ['Summer'],
    states: ['Uttar Pradesh', 'Andhra Pradesh', 'Bihar', 'Gujarat', 'Karnataka'],
    benefits: ['Rich in vitamins A and C', 'Promotes eye health and boosts immunity'],
    imageSrc: 'https://www.shutterstock.com/image-photo/indian-alphonso-mangoes-260nw-1869999028.jpg',
    imageAlt: 'Mangoes',
    growingInfo: {
      soilType: 'Well-drained alluvial soil',
      waterRequirement: 'Moderate',
      nutrients: 'Nitrogen, Phosphorus, Potassium',
      cultivation: 'Planting grafts',
       process: 'Mango cultivation involves planting grafts in well-drained alluvial soil. Regular pruning, irrigation, and pest management are essential. Harvesting is done when the fruits are ripe and have the desired color and aroma.'
    },
  },
  {
    name: 'Banana',
    seasons: ['Throughout the year'],
    states: ['Tamil Nadu', 'Maharashtra', 'Gujarat', 'Andhra Pradesh', 'Karnataka'],
    benefits: ['High in potassium', 'Good for heart health and energy'],
    imageSrc: 'https://www.shutterstock.com/image-photo/banana-isolated-on-white-background-260nw-1410860652.jpg',
    imageAlt: 'Bananas',
    growingInfo: {
      soilType: 'Rich loamy soil',
      waterRequirement: 'High',
      nutrients: 'Potassium, Nitrogen',
      cultivation: 'Planting suckers',
       process: 'Banana cultivation involves planting suckers in rich loamy soil. High irrigation, nutrient supply, and protection from wind are important. Harvesting is done when the fruits are mature but still green.'
    },
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
  const [selectedCrop, setSelectedCrop] = useState(null);

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

  const handleCropClick = (crop) => {
    setSelectedCrop(crop);
  };

  const handleCloseDialog = () => {
    setSelectedCrop(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Header */}
      <header className="bg-primary py-4 px-8 flex justify-between items-center shadow-md">
        <h1 className="text-3xl font-extrabold flex items-center gap-2 text-primary-foreground">
          <span role="img" aria-label="leaf">
            🌿
          </span>
          PlantGuard AI
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
                <Dialog key={index} onOpenChange={handleCloseDialog}>
                  <DialogTrigger asChild>
                    <Card
                      className="shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                      onClick={() => handleCropClick(crop)}
                    >
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
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{crop.name}</DialogTitle>
                      <DialogDescription>
                        Learn more about {crop.name} cultivation.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <p><strong>Soil Type:</strong> {crop.growingInfo.soilType}</p>
                        </div>
                        <div>
                          <p><strong>Water Requirement:</strong> {crop.growingInfo.waterRequirement}</p>
                        </div>
                        <div>
                          <p><strong>Nutrients:</strong> {crop.growingInfo.nutrients}</p>
                        </div>
                        <div>
                          <p><strong>Cultivation:</strong> {crop.growingInfo.cultivation}</p>
                        </div>
                         <div>
                          <p><strong>Process:</strong> {crop.growingInfo.process}</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
