import React from 'react';
import { ProgressBar } from '../ProgressBar.jsx';
import { UploadIcon } from '../icons/UploadIcon.jsx';
import { SparklesIcon } from '../icons/SparklesIcon.jsx';
import { DocumentTextIcon } from '../icons/DocumentTextIcon.jsx';
import { DownloadIcon } from '../icons/DownloadIcon.jsx';

export const CvReviewerUI = ({
  file,
  cvText,
  jobDescription,
  review,
  parsedReviewSections,
  isLoading,
  progress,
  error,
  docxError,
  fileInputRef,
  handleFileChange,
  handleJobDescriptionChange,
  handleReviewCv,
  handleDownloadReviewDocx,
}) => {
  return (
    <>
      {/* File Upload */}
      <div className="mb-6">
        <label
          htmlFor="cv-upload"
          className={`w-full flex items-center justify-center px-6 py-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${error && !file ? 'border-red-500 hover:border-red-400' : 'border-slate-600 hover:border-sky-500'}
            ${file ? 'bg-slate-700' : 'bg-slate-800 hover:bg-slate-700'}
          `}
        >
          <input
            type="file"
            id="cv-upload"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            disabled={isLoading}
          />
          <div className="text-center">
            {file ? (
              <>
                <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-sky-400" />
                <p className="text-slate-200 font-medium">{file.name}</p>
                <p className="text-xs text-slate-400">Klik buat ganti file PDF</p>
              </>
            ) : (
              <>
                <UploadIcon className="w-12 h-12 mx-auto mb-3 text-slate-500 group-hover:text-sky-400 transition-colors" />
                <p className="text-slate-300 font-medium">
                  {error && !file ? 'Coba file lain deh' : 'Klik buat upload atau drag & drop CV (PDF)'}
                </p>
                <p className="text-xs text-slate-500">Cuma file PDF ya</p>
              </>
            )}
          </div>
        </label>
        {error && (!file || (file && !cvText && !isLoading)) && (
          <p className="mt-2 text-sm text-red-400 text-center">{error}</p>
        )}
      </div>

      {/* Job Description Input */}
      <div className="mb-6">
        <label htmlFor="job-description" className="block text-sm font-medium text-slate-300 mb-1">
          Deskripsi Pekerjaan / Lowongan (Opsional, biar makin pas reviewnya!)
        </label>
        <textarea
          id="job-description"
          rows={4}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-slate-200 placeholder-slate-400 transition-colors"
          placeholder="Copy-paste deskripsi kerja atau requirement dari lowongan yang lo incer di sini..."
          value={jobDescription}
          onChange={handleJobDescriptionChange}
          disabled={isLoading}
        />
      </div>

      {file && cvText && !isLoading && !review && (
        <button
          onClick={handleReviewCv}
          disabled={isLoading || !cvText}
          className="w-full flex items-center justify-center bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-102 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SparklesIcon className="w-5 h-5 mr-2" />
          Review CV Gue Dong!
        </button>
      )}

      {isLoading && ( 
        <div className="my-6">
          <p className="text-center text-sky-300 mb-2 text-lg font-medium">
            {progress < 10 && !cvText && file ? 'Lagi baca PDF lo...' : 'Sabar ya, CV lo lagi di-review AI...'}
          </p>
          <ProgressBar progress={progress} />
          <p className="text-center text-xs text-slate-400 mt-2">{progress}% Kelar</p>
        </div>
      )}
      
      {error && cvText && !isLoading && ( 
         <div className="my-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md shadow-lg">
          <p className="font-semibold text-lg">Waduh, ada error pas review nih:</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}
      
      {docxError && !isLoading && ( 
         <div className="my-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md shadow-lg">
          <p className="font-semibold text-lg">Waduh, ada error pas generate DOCX hasil review nih:</p>
          <p className="mt-1 text-sm">{docxError}</p>
        </div>
      )}

      {parsedReviewSections.length > 0 && !isLoading && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-3xl font-semibold text-center sm:text-left bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
              Hasil Review CV Lo
            </h2>
            <button
                onClick={handleDownloadReviewDocx}
                disabled={isLoading || !review}
                className="w-full sm:w-auto flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transform hover:scale-102 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Unduh Hasil Review (.docx)
            </button>
          </div>

          {parsedReviewSections.map((section) => (
            <section key={section.id} aria-labelledby={section.id} className="bg-slate-700/70 p-4 sm:p-6 rounded-xl shadow-xl border border-slate-600/50">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="mr-3 sm:mr-4 shrink-0">{section.icon}</div>
                <h3 id={section.id} className="text-xl sm:text-2xl font-semibold text-sky-300">{section.title}</h3>
              </div>
              <div className="prose prose-sm sm:prose-base prose-slate max-w-none 
                              prose-strong:text-slate-100 prose-em:text-slate-300 
                              prose-p:text-slate-300 prose-li:text-slate-300
                              prose-headings:text-sky-300">
                {section.contentBlocks.map((block, idx) => React.cloneElement(block, { key: `${section.id}-block-${idx}`}))}
              </div>
            </section>
          ))}
        </div>
      )}
      
      {review && parsedReviewSections.length === 0 && !isLoading && !error && (
         <div className="mt-8 p-6 bg-slate-700/50 rounded-lg shadow-xl border border-slate-600">
          <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent">
            CV Review Feedback (Raw)
          </h2>
          <p className="text-sm text-amber-400 mb-2">Gagal mem-parsing review ke dalam sections, menampilkan mentahan:</p>
          <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed bg-slate-800 p-4 rounded-md max-h-[500px] overflow-y-auto">
            {review}
          </pre>
        </div>
      )}

      {!file && !isLoading && !review && !error && (
         <div className="text-center text-slate-500 py-10">
          <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Upload dulu CV lo biar bisa di-review.</p>
          <p className="text-xs mt-1">( inget ya, cuma file .pdf )</p>
        </div>
      )}
    </>
  );
};