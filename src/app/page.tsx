'use client';

import {useState} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {detectDisease} from '@/ai/flows/disease-detection';
import {suggestRemedies} from '@/ai/flows/remedy-suggestions';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {ExclamationTriangle} from 'lucide-react';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [disease, setDisease] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [causes, setCauses] = useState<string[] | null>(null);
  const [remedies, setRemedies] = useState<string[] | null>(null);
  const [plantDescription, setPlantDescription] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImage = async () => {
    if (!image) {
      alert('Please upload an image first.');
      return;
    }

    try {
      const diseaseDetectionResult = await detectDisease({photoUrl: image});
      setDisease(diseaseDetectionResult.disease);
      setConfidence(diseaseDetectionResult.confidence);

      const remedySuggestionsResult = await suggestRemedies({
        disease: diseaseDetectionResult.disease,
        plantDescription: plantDescription,
      });
      setCauses(remedySuggestionsResult.possibleCauses);
      setRemedies(remedySuggestionsResult.remedies);
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      alert(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center p-8">
      <Card className="w-full max-w-md space-y-4">
        <CardHeader>
          <CardTitle>CropGuard AI</CardTitle>
          <CardDescription>Upload an image of your plant to detect diseases and get remedy suggestions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" accept="image/*" onChange={handleImageUpload} />
          {image && (
            <img src={image} alt="Uploaded plant" className="rounded-md shadow-md" style={{maxHeight: '200px', objectFit: 'contain'}} />
          )}
          <Textarea
            placeholder="Describe your plant and its environment (e.g., type of plant, location, watering schedule)"
            value={plantDescription}
            onChange={(e) => setPlantDescription(e.target.value)}
          />
          <Button onClick={handleAnalyzeImage} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
            Analyze Image
          </Button>
        </CardContent>
      </Card>

      {disease && confidence !== null && (
        <Card className="w-full max-w-md mt-8">
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
          </CardHeader>
          <CardContent>
            {disease === 'No disease detected' ? (
              <Alert>
                <ExclamationTriangle className="h-4 w-4" />
                <AlertTitle>No Disease Detected</AlertTitle>
                <AlertDescription>No disease was detected in the image.</AlertDescription>
              </Alert>
            ) : (
              <>
                <p>
                  Detected Disease: <Badge variant="destructive">{disease}</Badge>
                </p>
                <p>Confidence: {(confidence * 100).toFixed(2)}%</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {causes && remedies && (
        <Card className="w-full max-w-md mt-8">
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
    </div>
  );
}
