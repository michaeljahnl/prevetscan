import React, { useState, useRef } from 'react';
import { HealthCategory, AnalysisResult } from '../types';
import { analyzePetImage } from '../services/geminiService';
import Button from './Button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AnalysisViewProps {
  onBack: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ onBack }) => {
  const [category, setCategory] = useState<HealthCategory>(HealthCategory.TEETH);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;
    
    setIsAnalyzing(true);
    try {
      const base64Data = imagePreview.split(',')[1];
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: base64Data, 
          category: category 
        })
      });

      if (!response.ok) throw new Error('Analysis failed');
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Something went wrong with the analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToPDF = async () => {
    const element = document.getElementById('analysis-content');
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    
    const imgWidth = pageWidth - (2 * margin);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pageContentHeight = pageHeight - (2 * margin);
    let heightLeft = imgHeight;
    let position = 0;
    
    // First page
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    heightLeft -= pageContentHeight;
    
    // Additional pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position + margin, imgWidth, imgHeight);
      heightLeft -= pageContentHeight;
    }
    
    // Add footers to all pages
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.text('PreVetScan.com', pageWidth / 2, pageHeight - 5, { align: 'center' });
      pdf.text(`${i}/${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
    }
    
    pdf.save(`PreVetScan-${Date.now()}.pdf`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Button variant="outline" onClick={onBack} className="mb-6 !py-2 !px-3 text-sm">
        ← Back to Home
      </Button>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">New Health Scan</h2>
          <p className="text-slate-500 mb-6">Select a category and upload a clear photo for AI analysis.</p>

          <div className="space-y-6">
            {/* Category Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Area of Concern</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.values(HealthCategory).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      category === cat 
                        ? 'bg-teal-50 border-teal-500 text-teal-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-64 rounded-lg shadow-md mx-auto" 
                  />
                  <button 
                    onClick={() => {
                      setImagePreview(null);
                      setResult(null);
                    }}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="text-slate-600 font-medium">Click to upload or take photo</div>
                  <p className="text-sm text-slate-400">Supports JPG, PNG (Max 5MB)</p>
                </div>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <Button 
                disabled={!imagePreview} 
                onClick={handleAnalyze} 
                isLoading={isAnalyzing}
                className="w-full md:w-auto"
              >
                {isAnalyzing ? 'Analyzing...' : 'Run Health Check'}
              </Button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-slate-50 border-t border-slate-100 p-6 md:p-8 animate-fade-in">
            <div id="analysis-content" className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-slate-200">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">PreVetScan Analysis Report</h3>
                  <p className="text-sm text-slate-500 mt-1">Generated {new Date().toLocaleDateString()}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getSeverityColor(result.severity)}`}>
                  {result.severity}
                </span>
              </div>

              {/* Pet Image */}
              {imagePreview && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <img src={imagePreview} alt="Pet" className="max-h-64 mx-auto rounded-lg" />
                </div>
              )}

              {/* Title */}
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-teal-500">
                <h4 className="text-xl font-bold text-slate-900 mb-2">{result.title}</h4>
                <div className="flex items-center text-orange-700 bg-orange-50 px-3 py-2 rounded mt-3">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">{result.urgency}</span>
                </div>
              </div>
              
              {/* Financial Forecast */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg border border-teal-200 shadow-sm">
                <div className="flex items-center text-teal-800 font-bold text-lg mb-3">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Financial Forecast
                </div>
                <p className="text-teal-900 leading-relaxed">{result.financialForecast}</p>
              </div>

              {/* Observations */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Visual Observations
                </h4>
                <ul className="space-y-3">
                  {result.observations.map((obs, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-teal-600 font-bold mr-3 flex-shrink-0">•</span>
                      <span className="text-slate-700 leading-relaxed">{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Possible Causes */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Possible Causes (Differential Considerations)
                </h4>
                <div className="space-y-4">
                  {result.possibleCauses.map((cause, idx) => (
                    <div key={idx} className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-50">
                      <p className="text-slate-800 leading-relaxed">{cause}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* What Vet Will Examine */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  What Your Veterinarian Will Examine
                </h4>
                <ul className="space-y-3">
                  {result.vetWillExamine.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-slate-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Questions to Ask */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Questions to Ask Your Veterinarian
                </h4>
                <ul className="space-y-3">
                  {result.questionsToAsk.map((question, idx) => (
                    <li key={idx} className="flex items-start bg-purple-50 p-3 rounded">
                      <span className="text-purple-600 font-bold mr-3 flex-shrink-0">{idx + 1}.</span>
                      <span className="text-slate-700 leading-relaxed">{question}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h4 className="text-lg font-bold text-blue-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Immediate Next Steps
                </h4>
                <p className="text-blue-900 leading-relaxed">{result.nextSteps}</p>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h5 className="font-bold text-amber-800 mb-2">Important Disclaimer</h5>
                    <p className="text-sm text-amber-900 leading-relaxed">{result.disclaimer}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button onClick={exportToPDF} variant="secondary" className="flex-1 justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </Button>
              
              <Button 
                onClick={() => alert('Email feature coming soon!')} 
                variant="outline" 
                className="flex-1 justify-center border-teal-300 text-teal-700 hover:bg-teal-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email to Vet
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisView;