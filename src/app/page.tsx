'use client';

import React, {useState, useCallback} from 'react';
import {UploadCloud, AlertTriangle} from 'lucide-react';
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
    name: 'Wheat',
    benefits: [
      'Rich in carbohydrates, providing energy.',
      'Good source of dietary fiber, aiding digestion.',
      'Contains essential vitamins and minerals like iron and magnesium.',
    ],
    imageSrc: 'https://picsum.photos/400/300?random=1',
    imageAlt: 'Golden wheat field',
  },
  {
    name: 'Rice',
    benefits: [
      'Staple food for a large part of the world’s population.',
      'Easy to digest and gluten-free.',
      'Provides a good source of manganese and selenium.',
    ],
    imageSrc: 'https://picsum.photos/400/300?random=2',
    imageAlt: 'Terraced rice paddies',
  },
  {
    name: 'Corn',
    benefits: [
      'Versatile grain used in many food products.',
      'Good source of antioxidants.',
      'Contains vitamins A, B, and E.',
    ],
    imageSrc: 'https://picsum.photos/400/300?random=3',
    imageAlt: 'Rows of corn stalks',
  },
  {
    name: 'Soybeans',
    benefits: [
      'High in protein, essential for muscle building and repair.',
      'Good source of healthy fats and fiber.',
      'Contains isoflavones, which may have health benefits.',
    ],
    imageSrc: 'https://picsum.photos/400/300?random=4',
    imageAlt: 'Soybean plants in a field',
  },
  {
    name: 'Potatoes',
    benefits: [
      'Excellent source of vitamin C and potassium.',
      'Provides energy and helps regulate blood sugar levels.',
      'Can be prepared in many ways, making them a versatile food.',
    ],
    imageSrc: 'https://picsum.photos/400/300?random=5',
    imageAlt: 'Harvested potatoes in a basket',
  },
];

export default function PlantDiseaseDetector() {
  const [image, setImage] = useState<string | null>(null);
  const [plantName, setPlantName] = useState<string | null>(null);
  const [disease, setDisease] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [causes, setCauses] = useState<string[] | null>(null);
  const [remedies, setRemedies] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const {toast} = useToast();
  const [showHomeDescription, setShowHomeDescription] = useState(true);
  const [showAiEngine, setShowAiEngine] = useState(false);

  const analyzeImage = useCallback(
    async (img: string) => {
      setLoading(true);
      try {
        const diseaseDetectionResult = await detectDisease({photoUrl: img});
        setPlantName(diseaseDetectionResult.plantName);
        setDisease(diseaseDetectionResult.disease);
        setConfidence(diseaseDetectionResult.confidence);

        const remedySuggestionsResult = await suggestRemedies({
          disease: diseaseDetectionResult.disease,
          plantDescription: plantName ? `Plant name: ${plantName}, Disease: ${disease}` : 'Plant description not available.',
        });
        setCauses(remedySuggestionsResult.possibleCauses);
        setRemedies(remedySuggestionsResult.remedies);
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
  };

  const handleAiEngineClick = () => {
    setShowAiEngine(true);
    setShowHomeDescription(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="bg-primary py-4 px-8 flex justify-between items-center shadow-md">
        <h1 className="text-3xl font-extrabold flex items-center gap-2 text-primary-foreground">
          <span role="img" aria-label="leaf">
            🌿
          </span>{' '}
          CropGuard AI{' '}
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
          <Button
            className="mt-4 bg-accent text-accent-foreground font-bold py-2 px-6 rounded-full shadow hover:bg-accent/80"
            onClick={handleAiEngineClick}
          >
            AI Engine
          </Button>
        </div>
      )}

      {/* Home Description */}
      {showHomeDescription && (
        <div className="mt-8 px-4">
          <h2 className="text-3xl font-semibold mb-4 text-center">Welcome to CropGuard AI</h2>
          <p className="text-lg mb-6 text-center">
            Our website is dedicated to helping farmers and gardeners identify and manage plant diseases using the power of AI.
           
          </p>

          
        </div>
      )}

      {/* AI Engine Section */}
      {showAiEngine && (
        <Card className="mt-10 p-6 rounded-xl w-11/12 max-w-2xl mx-auto text-center shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-800">Upload Plant Image</CardTitle>
            <CardDescription>Drag and drop an image, or select one from your files.</CardDescription>
          </CardHeader>
          <CardContent>
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

            {loading && <p className="mt-4 text-green-800 font-medium animate-pulse">Analyzing image...</p>}

            {image && (
              <img
                src={image}
                alt="Uploaded Leaf"
                className="mt-6 w-full h-64 object-cover rounded-xl shadow-lg border"
              />
            )}
          </CardContent>
        </Card>
      )}

      {disease && confidence !== null && plantName && showAiEngine && (
        <Card className="w-full max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
          </CardHeader>
          <CardContent>
            {disease === 'No disease detected' ? (
              <Alert>
                <AlertTitle>No Disease Detected</AlertTitle>
                <AlertDescription>No disease was detected in the image.</AlertDescription>
              </Alert>
            ) : (
              <>
                <div>
                  Detected Plant: <Badge variant="secondary">{plantName}</Badge>
                </div>
                <div>
                  Detected Disease: <Badge variant="destructive">{plantName} - {disease}</Badge>
                </div>
                <p>Confidence: {(confidence * 100).toFixed(2)}%</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {causes && remedies && showAiEngine && (
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


