
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import BasicInfoStep from "@/components/campaign/BasicInfoStep";
import StoryStep from "@/components/campaign/StoryStep";
import FundingStep from "@/components/campaign/FundingStep";
import ProgressSteps from "@/components/campaign/ProgressSteps";
import { useCampaignCreation } from "@/hooks/useCampaignCreation";

const StartCampaign = () => {
  const {
    formData,
    setFormData,
    activeStep,
    isLoading,
    nextStep,
    prevStep,
    handleCreateCampaign
  } = useCampaignCreation();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">Start Your Campaign</h1>
          <p className="text-gray-600 mb-8">Bring your creative project to life</p>
          
          <ProgressSteps activeStep={activeStep} />
          
          <Card>
            <CardContent className="p-6">
              {activeStep === 1 && (
                <BasicInfoStep formData={formData} setFormData={setFormData} />
              )}
              
              {activeStep === 2 && (
                <StoryStep formData={formData} setFormData={setFormData} />
              )}
              
              {activeStep === 3 && (
                <FundingStep formData={formData} setFormData={setFormData} />
              )}
              
              <div className="flex justify-between mt-8">
                {activeStep > 1 ? (
                  <Button variant="outline" onClick={prevStep} disabled={isLoading}>
                    Back
                  </Button>
                ) : (
                  <div></div>
                )}
                
                {activeStep < 3 ? (
                  <Button onClick={nextStep} className="bg-green-500 hover:bg-green-600">
                    Continue
                  </Button>
                ) : (
                  <Button 
                    className="bg-green-500 hover:bg-green-600"
                    onClick={handleCreateCampaign}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Campaign...
                      </>
                    ) : (
                      "Submit Campaign"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StartCampaign;
