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
  const totalPages = pdf.internal.pages.length - 1; // -1 because pages array includes a null first element
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

        {/* Results Section - WRAPPED IN DIV FOR PDF EXPORT */}
        {result && (
          <div className="bg-slate-50 border-t border-slate-100 p-6 md:p-8 animate-fade-in">
            <div id="analysis-content" className="space-y-6">
              {/* PDF Export Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">PreVetScan Analysis Report</h3>
                  <p className="text-xs text-slate-500 mt-1">Generated {new Date().toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getSeverityColor(result.severity)}`}>
                  Severity: {result.severity}
                </span>
              </div>

              {/* Pet Image in PDF */}
              {imagePreview && (
                <div className="bg-white p-4 rounded-lg">
                  <img src={imagePreview} alt="Pet" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                </div>
              )}
              
              {/* Financial Forecast Card */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-teal-200 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center text-teal-800 font-semibold mb-1">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Financial Forecast
                  </div>
                  <p className="text-teal-900 text-sm font-medium">{result.financialForecast}</p>
                </div>
                <div className="absolute right-0 top-0 -mt-2 -mr-2 w-20 h-20 bg-teal-200 rounded-full opacity-20"></div>
              </div>

              {/* Analysis Details */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-1">{result.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{result.recommendation}</p>
              </div>

              {/* Observations */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Observations</h4>
                <ul className="space-y-2">
                  {result.observations.map((obs, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-slate-700">
                      <svg className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">{result.disclaimer}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - OUTSIDE the analysis-content div */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
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