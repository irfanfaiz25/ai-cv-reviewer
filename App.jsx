import React, { useState, useCallback, useEffect, useRef } from "react";
import { ProgressBar } from "./src/components/ProgressBar.jsx";
import {
  getCVReview,
  generateCvFromFormData,
  refineCvSectionText,
  generateOptimizedCvFromReview,
  translateCvFormDataToEnglish,
} from "./src/services/geminiService.js";
import { UploadIcon } from "./src/components/icons/UploadIcon.jsx";
import { SparklesIcon } from "./src/components/icons/SparklesIcon.jsx";
import { DocumentTextIcon } from "./src/components/icons/DocumentTextIcon.jsx";
import {
  CV_REVIEW_PROMPT_TEMPLATE,
  EXPECTED_SECTION_TITLES_ORDERED,
  TEXT_REFINEMENT_PROMPT_TEMPLATES,
} from "./constants.js";
import { DownloadIcon } from "./src/components/icons/DownloadIcon.jsx";
import { LightbulbIcon } from "./src/components/icons/LightbulbIcon.jsx";
import { ThumbUpIcon } from "./src/components/icons/ThumbUpIcon.jsx";
import { WrenchScrewdriverIcon } from "./src/components/icons/WrenchScrewdriverIcon.jsx";
import { ChatBubbleOvalLeftEllipsisIcon } from "./src/components/icons/ChatBubbleOvalLeftEllipsisIcon.jsx";
import { TargetIcon } from "./src/components/icons/TargetIcon.jsx";
import { ArrowPathIcon } from "./src/components/icons/ArrowPathIcon.jsx";
import { PlusCircleIcon } from "./src/components/icons/PlusCircleIcon.jsx";
import { TrashIcon } from "./src/components/icons/TrashIcon.jsx";
import { PencilSquareIcon } from "./src/components/icons/PencilSquareIcon.jsx";
import { EyeIcon } from "./src/components/icons/EyeIcon.jsx";
import { BriefcaseIcon } from "./src/components/icons/BriefcaseIcon.jsx";
import { LanguageSelectionModal } from "./src/components/modals/LanguageSelectionModal.jsx";

import { AppFooter } from "./src/components/layout/AppFooter.jsx";
import { AppHeader } from "./src/components/layout/AppHeader.jsx";

import { CvReviewerUI } from "./src/components/cv-reviewer/CvReviewerUI.jsx";

import * as pdfjsLib from "pdfjs-dist";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import saveAs from "file-saver";
import { CvGeneratorUI } from "./src/components/cv-generator/CvGeneratorUI.jsx";
import { ResetConfirmationModal } from "./src/components/modals/ResetConfirmationModal.jsx";

const pdfjsInstance = pdfjsLib;
pdfjsInstance.GlobalWorkerOptions.workerSrc =
  "https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs";

const initialCvFormData = {
  namaLengkap: "",
  email: "",
  nomorTelepon: "",
  alamatSingkat: "",
  linkedinUrl: "",
  portfolioUrl: "",
  ringkasanProfil: "",
  pengalamanKerja: [],
  pendidikan: [],
  keterampilan: "",
  pengalamanOrganisasi: [],
  penghargaanSertifikasi: [],
};

const App = () => {
  const [currentMode, setCurrentMode] = useState("reviewer");

  // CV Reviewer States
  const [file, setFile] = useState(null);
  const [cvText, setCvText] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [review, setReview] = useState(null);
  const [parsedReviewSections, setParsedReviewSections] = useState([]);
  const [generatedOptimizedCvText, setGeneratedOptimizedCvText] =
    useState(null);
  const [isGeneratingOptimizedCv, setIsGeneratingOptimizedCv] = useState(false);
  const [optimizedCvError, setOptimizedCvError] = useState(null);

  // CV Generator States
  const [cvFormData, setCvFormData] = useState(initialCvFormData);
  const [generatedCvText, setGeneratedCvText] = useState(null);
  const [isGeneratingCv, setIsGeneratingCv] = useState(false);
  const [cvGenerationError, setCvGenerationError] = useState(null);
  const [isRefiningField, setIsRefiningField] = useState({});
  const [isTranslatingFormData, setIsTranslatingFormData] = useState(false);

  // Language Modal States
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedGenerationLanguage, setSelectedGenerationLanguage] =
    useState(null);
  const [languageModalTrigger, setLanguageModalTrigger] = useState(null);

  // Common States
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [docxError, setDocxError] = useState(null);

  const [showResetModal, setShowResetModal] = useState(false);
  const fileInputRef = useRef(null);

  // --- Common Utility Functions ---
  const resetReviewerStates = () => {
    setFile(null);
    setCvText(null);
    setJobDescription("");
    setReview(null);
    setParsedReviewSections([]);
    setError(null);
    setDocxError(null);
    setGeneratedOptimizedCvText(null);
    setIsGeneratingOptimizedCv(false);
    setOptimizedCvError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetGeneratorStates = () => {
    setCvFormData(initialCvFormData);
    setGeneratedCvText(null);
    setCvGenerationError(null);
    setDocxError(null);
    setIsRefiningField({});
    setIsTranslatingFormData(false);
  };

  const resetLanguageModalStates = () => {
    setShowLanguageModal(false);
    setSelectedGenerationLanguage(null);
    setLanguageModalTrigger(null);
  };

  const resetAllStates = () => {
    resetReviewerStates();
    resetGeneratorStates();
    resetLanguageModalStates();
    setIsLoading(false);
    setIsGeneratingCv(false);
    setProgress(0);
    setError(null);
    setDocxError(null);
  };

  const handleShowResetModal = () => setShowResetModal(true);
  const handleCloseResetModal = () => setShowResetModal(false);

  const handleFullReset = () => {
    resetAllStates();
    handleCloseResetModal();
  };

  const handleModeChange = (mode) => {
    if (currentMode !== mode) {
      handleFullReset();
      setCurrentMode(mode);
    }
  };

  // --- Language Modal Handling ---
  const handleOpenLanguageModal = (trigger) => {
    setLanguageModalTrigger(trigger);
    setShowLanguageModal(true);
  };

  const handleLanguageSelected = async (language) => {
    setSelectedGenerationLanguage(language);
    setShowLanguageModal(false);

    if (languageModalTrigger === "fromReview") {
      await proceedWithOptimizedCvGeneration(language);
    } else if (languageModalTrigger === "fromForm") {
      await proceedWithFormCvGeneration(language);
    }
  };

  // --- CV Reviewer Specific Functions ---
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf") {
        resetReviewerStates();
        setFile(selectedFile);
        setIsLoading(true);
        setProgress(5);

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result;
            if (!arrayBuffer) {
              setError("Could not read file content.");
              setFile(null);
              setIsLoading(false);
              setProgress(0);
              return;
            }
            const pdf = await pdfjsInstance.getDocument({ data: arrayBuffer })
              .promise;
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              fullText +=
                textContent.items.map((item) => item.str).join(" ") + "\n";
            }
            setCvText(fullText.trim());
            setError(null);
          } catch (pdfError) {
            console.error("Error parsing PDF:", pdfError);
            setError(
              "Failed to parse PDF file. Please ensure it is a valid PDF. " +
                (pdfError instanceof Error
                  ? pdfError.message
                  : "Unknown PDF parsing error.")
            );
            setFile(null);
            setCvText(null);
          } finally {
            setIsLoading(false);
            setProgress(0);
          }
        };
        reader.onerror = () => {
          setError("Failed to read the file.");
          setFile(null);
          setCvText(null);
          setIsLoading(false);
          setProgress(0);
        };
        reader.readAsArrayBuffer(selectedFile);
      } else {
        setError("Invalid file type. Please upload a .pdf file.");
        setFile(null);
        setCvText(null);
      }
    } else {
      if (!event.target.files?.length && file) {
        resetReviewerStates();
      }
    }
  };

  const handleJobDescriptionChange = (event) => {
    setJobDescription(event.target.value);
  };

  const processInlineMarkdown = (text) => {
    return text
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold text-slate-100">$1</strong>'
      )
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>');
  };

  const parseReviewToSections = useCallback((markdownText) => {
    if (!markdownText) return [];
    const sections = [];
    let remainingText = markdownText;

    EXPECTED_SECTION_TITLES_ORDERED.forEach((titleKey, index) => {
      const escapedTitleKey = titleKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const titlePattern = new RegExp(
        `^##\\s*(?:\\d+\\.\\s*)?${escapedTitleKey}\\s*[:]*`,
        "im"
      );
      let sectionContent = "";
      let actualTitle = titleKey;
      const match = remainingText.match(titlePattern);

      if (match) {
        actualTitle = match[0]
          .replace(/^##\s*(?:\d+\\.\\s*)?/, "")
          .replace(/:$/, "")
          .trim();
        const nextTitleKey = EXPECTED_SECTION_TITLES_ORDERED[index + 1];
        let endIdx = remainingText.length;

        if (nextTitleKey) {
          const escapedNextTitleKey = nextTitleKey.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );
          const nextTitlePattern = new RegExp(
            `^##\\s*(?:\\d+\\.\\s*)?${escapedNextTitleKey}`,
            "im"
          );
          const nextMatch = remainingText
            .substring(match.index + match[0].length)
            .match(nextTitlePattern);
          if (nextMatch)
            endIdx = match.index + match[0].length + nextMatch.index;
        }
        sectionContent = remainingText
          .substring(match.index + match[0].length, endIdx)
          .trim();
        remainingText = remainingText.substring(endIdx);
      } else {
        console.warn(
          `Expected section title "${titleKey}" not found or out of order.`
        );
        return;
      }

      const contentLines = sectionContent
        .split("\n")
        .map((line) => line.trim());
      const contentBlocks = [];
      let currentListItems = [];

      const flushList = () => {
        if (currentListItems.length > 0) {
          contentBlocks.push(
            <ul
              key={`ul-${index}-${contentBlocks.length}`}
              className="list-disc list-inside space-y-1 my-2 pl-4 text-slate-300"
            >
              {currentListItems.map((item, idx) => (
                <li
                  key={`li-${idx}`}
                  dangerouslySetInnerHTML={{
                    __html: processInlineMarkdown(item),
                  }}
                />
              ))}
            </ul>
          );
          currentListItems = [];
        }
      };

      contentLines.forEach((line, lineIdx) => {
        if (line.startsWith("* ") || line.startsWith("- ")) {
          currentListItems.push(line.substring(2));
        } else {
          flushList();
          if (line.trim() !== "") {
            if (line.startsWith("### ")) {
              contentBlocks.push(
                <h4
                  key={`h4-${index}-${lineIdx}`}
                  className="text-md font-semibold text-sky-300 mt-3 mb-1"
                  dangerouslySetInnerHTML={{
                    __html: processInlineMarkdown(line.substring(4)),
                  }}
                />
              );
            } else {
              contentBlocks.push(
                <p
                  key={`p-${index}-${lineIdx}`}
                  className="my-1 text-slate-300"
                  dangerouslySetInnerHTML={{
                    __html: processInlineMarkdown(line),
                  }}
                />
              );
            }
          }
        }
      });
      flushList();

      let icon;
      const defaultIconClass = "w-7 h-7 sm:w-8 sm:h-8";
      switch (titleKey) {
        case EXPECTED_SECTION_TITLES_ORDERED[0]:
          icon = (
            <LightbulbIcon className={`${defaultIconClass} text-yellow-400`} />
          );
          break;
        case EXPECTED_SECTION_TITLES_ORDERED[1]:
          icon = (
            <ThumbUpIcon className={`${defaultIconClass} text-green-400`} />
          );
          break;
        case EXPECTED_SECTION_TITLES_ORDERED[2]:
          icon = (
            <WrenchScrewdriverIcon
              className={`${defaultIconClass} text-orange-400`}
            />
          );
          break;
        case EXPECTED_SECTION_TITLES_ORDERED[3]:
          icon = (
            <SparklesIcon className={`${defaultIconClass} text-sky-400`} />
          );
          break;
        case EXPECTED_SECTION_TITLES_ORDERED[4]:
          icon = <TargetIcon className={`${defaultIconClass} text-red-400`} />;
          break;
        case EXPECTED_SECTION_TITLES_ORDERED[5]:
          icon = (
            <ChatBubbleOvalLeftEllipsisIcon
              className={`${defaultIconClass} text-purple-400`}
            />
          );
          break;
        default:
          icon = (
            <SparklesIcon className={`${defaultIconClass} text-slate-400`} />
          );
      }

      if (contentBlocks.length > 0 || sectionContent.trim() !== "") {
        sections.push({
          id: `section-${index}-${titleKey.toLowerCase().replace(/\s+/g, "-")}`,
          title: actualTitle,
          icon: icon,
          contentBlocks: contentBlocks,
          rawContent: sectionContent,
        });
      }
    });

    if (
      remainingText.trim().length > 0 &&
      sections.length < EXPECTED_SECTION_TITLES_ORDERED.length
    ) {
      console.warn(
        "Found remaining text not captured by expected sections:",
        remainingText.trim()
      );
    }
    return sections;
  }, []);

  const handleReviewCv = useCallback(async () => {
    if (!cvText) {
      setError(
        "CV content is not available. Please upload and parse a valid .pdf file."
      );
      return;
    }
    setIsLoading(true);
    setProgress(0);
    setError(null);
    setDocxError(null);
    setReview(null);
    setParsedReviewSections([]);
    setGeneratedOptimizedCvText(null);
    setOptimizedCvError(null);
    setProgress(10);

    try {
      const jobDescText =
        jobDescription.trim() ||
        "Pengguna tidak menyediakan deskripsi pekerjaan.";
      const prompt = CV_REVIEW_PROMPT_TEMPLATE.replace(
        "[CV_TEXT_HERE]",
        cvText
      ).replace("[JOB_DESCRIPTION_HERE]", jobDescText);
      const reviewResult = await getCVReview(prompt);
      setReview(reviewResult);
      const parsedSections = parseReviewToSections(reviewResult);
      setParsedReviewSections(parsedSections);
      setProgress(100);
    } catch (err) {
      console.error("Error during CV review:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to review CV. Please try again."
      );
      setProgress(0);
    } finally {
      setIsLoading(false);
    }
  }, [cvText, jobDescription, parseReviewToSections]);

  const proceedWithOptimizedCvGeneration = async (language) => {
    if (!cvText || !review) {
      setOptimizedCvError(
        "CV asli atau teks review tidak tersedia untuk optimasi."
      );
      setSelectedGenerationLanguage(null);
      setLanguageModalTrigger(null);
      return;
    }
    setIsGeneratingOptimizedCv(true);
    setGeneratedOptimizedCvText(null);
    setOptimizedCvError(null);
    setDocxError(null);

    try {
      const optimizedCv = await generateOptimizedCvFromReview(
        cvText,
        review,
        language
      );
      setGeneratedOptimizedCvText(optimizedCv);

      if (optimizedCv) {
        const baseFileName = file
          ? file.name.replace(/\.[^/.]+$/, "")
          : "CV_AI_Optimal";
        await createAndDownloadDocx(
          optimizedCv,
          baseFileName,
          "generated_cv",
          language
        );
      } else {
        throw new Error(
          "Gagal menghasilkan CV yang dioptimalkan (hasil kosong dari AI)."
        );
      }
    } catch (err) {
      console.error(
        "Error generating/downloading optimized CV from review:",
        err
      );
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Gagal memproses CV yang dioptimalkan.";
      setOptimizedCvError(errorMessage);
    } finally {
      setIsGeneratingOptimizedCv(false);
      setSelectedGenerationLanguage(language);
      setLanguageModalTrigger(null);
    }
  };

  useEffect(() => {
    let intervalId;
    if (
      currentMode === "reviewer" &&
      isLoading &&
      progress < 90 &&
      !review &&
      !error
    ) {
      intervalId = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            if (intervalId !== undefined) clearInterval(intervalId);
            return 90;
          }
          return prev + 5;
        });
      }, 300);
    }
    return () => {
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, [isLoading, progress, review, error, currentMode]);

  // --- CV Generator Specific Functions ---

  const handleCvFormInputChange = (event) => {
    const { name, value } = event.target;
    setCvFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDynamicListChange = (listName, index, fieldName, value) => {
    setCvFormData((prev) => {
      const currentList = prev[listName];
      const newList = [...currentList];
      if (newList[index]) {
        newList[index] = { ...newList[index], [fieldName]: value };
      }
      return { ...prev, [listName]: newList };
    });
  };

  const addDynamicListItem = (listName, newItem) => {
    setCvFormData((prev) => ({
      ...prev,
      [listName]: [...prev[listName], newItem],
    }));
  };

  const removeDynamicListItem = (listName, index) => {
    setCvFormData((prev) => ({
      ...prev,
      [listName]: prev[listName].filter((_, i) => i !== index),
    }));
  };

  const handleRefineField = async (
    fieldIdentifier,
    sectionType,
    textToRefine,
    itemIndex
  ) => {
    setIsRefiningField((prev) => ({ ...prev, [fieldIdentifier]: true }));
    setCvGenerationError(null);

    try {
      const promptTemplate = TEXT_REFINEMENT_PROMPT_TEMPLATES[sectionType];
      if (!promptTemplate)
        throw new Error(`No prompt template for section type: ${sectionType}`);

      const prompt = promptTemplate.replace("[USER_INPUT_HERE]", textToRefine);
      const refinedText = await refineCvSectionText(prompt);

      if (typeof itemIndex === "number" && fieldIdentifier.includes("_")) {
        const parts = fieldIdentifier.split("_");
        const listNameKey = parts[0];
        const itemPropertyToUpdate = parts[2];

        setCvFormData((prev) => {
          const currentList = prev[listNameKey];
          const newList = [...currentList];
          const item = newList[itemIndex];

          if (item) {
            const updatedItem = { ...item };
            if (
              listNameKey === "pengalamanKerja" &&
              "deskripsiPekerjaan" in updatedItem &&
              itemPropertyToUpdate === "deskripsiPekerjaan"
            ) {
              updatedItem.deskripsiPekerjaan = refinedText;
            } else if (
              listNameKey === "pendidikan" &&
              "deskripsiPendidikan" in updatedItem &&
              itemPropertyToUpdate === "deskripsiPendidikan"
            ) {
              updatedItem.deskripsiPendidikan = refinedText;
            } else if (
              listNameKey === "pengalamanOrganisasi" &&
              "deskripsiKegiatan" in updatedItem &&
              itemPropertyToUpdate === "deskripsiKegiatan"
            ) {
              updatedItem.deskripsiKegiatan = refinedText;
            }
            if ("isRefining" in updatedItem) {
              updatedItem.isRefining = false;
            }
            newList[itemIndex] = updatedItem;
          }
          return { ...prev, [listNameKey]: newList };
        });
      } else {
        setCvFormData((prev) => ({
          ...prev,
          [fieldIdentifier]: refinedText,
        }));
      }
    } catch (err) {
      console.error(`Error refining field ${fieldIdentifier}:`, err);
      setCvGenerationError(
        err instanceof Error
          ? err.message
          : `Gagal menyempurnakan ${fieldIdentifier}.`
      );
    } finally {
      setIsRefiningField((prev) => ({ ...prev, [fieldIdentifier]: false }));
    }
  };

  const proceedWithFormCvGeneration = async (language) => {
    setIsGeneratingCv(true);
    setCvGenerationError(null);
    setGeneratedCvText(null);
    setDocxError(null);

    let dataForGeneration = { ...cvFormData };

    if (language === "en") {
      setIsTranslatingFormData(true);
      try {
        dataForGeneration.pengalamanKerja =
          dataForGeneration.pengalamanKerja.map(
            ({ isRefining, ...rest }) => rest
          );
        dataForGeneration.pendidikan = dataForGeneration.pendidikan.map(
          ({ isRefining, ...rest }) => rest
        );

        dataForGeneration = await translateCvFormDataToEnglish(
          dataForGeneration
        );
      } catch (err) {
        console.error("Error translating CV form data to English:", err);
        setCvGenerationError(
          err instanceof Error
            ? `Gagal menerjemahkan data ke Bahasa Inggris: ${err.message}`
            : "Gagal menerjemahkan data ke Bahasa Inggris. Coba lagi."
        );
        setIsTranslatingFormData(false);
        setIsGeneratingCv(false);
        setSelectedGenerationLanguage(null);
        setLanguageModalTrigger(null);
        return;
      }
      setIsTranslatingFormData(false);
    }

    try {
      dataForGeneration.pengalamanKerja = dataForGeneration.pengalamanKerja.map(
        ({ isRefining, ...rest }) => rest
      );
      dataForGeneration.pendidikan = dataForGeneration.pendidikan.map(
        ({ isRefining, ...rest }) => rest
      );

      const newCv = await generateCvFromFormData(dataForGeneration, language);
      setGeneratedCvText(newCv);
    } catch (err) {
      console.error("Error generating CV from form:", err);
      setCvGenerationError(
        err instanceof Error
          ? err.message
          : "Gagal men-generate CV dari form. Coba lagi ya."
      );
    } finally {
      setIsGeneratingCv(false);
      setSelectedGenerationLanguage(language);
      setLanguageModalTrigger(null);
    }
  };

  // --- DOCX Generation (Unified for Review and Generated CV) ---
  const createAndDownloadDocx = async (
    markdownText,
    baseFileName,
    type,
    language = "id"
  ) => {
    const children = [];
    const lines = markdownText.split("\n");

    const HEADING_1_STYLE = {
      text: "",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
      alignment: AlignmentType.CENTER,
    };
    const HEADING_2_STYLE = {
      text: "",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    };
    const HEADING_3_STYLE = {
      text: "",
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 160, after: 80 },
    };
    const BULLET_STYLE = {
      bullet: { level: 0 },
      indent: { left: 720 },
      spacing: { after: 80 },
    };
    const PARAGRAPH_STYLE = { spacing: { after: 100 } };

    if (
      type === "generated_cv" &&
      currentMode === "generator" &&
      language === "id"
    ) {
      const name = cvFormData.namaLengkap;
      const email = cvFormData.email;
      const phone = cvFormData.nomorTelepon;
      const address = cvFormData.alamatSingkat;
      const linkedin = cvFormData.linkedinUrl;
      const portfolio = cvFormData.portfolioUrl;

      if (name) {
        children.push(
          new Paragraph({ ...HEADING_1_STYLE, text: name.toUpperCase() })
        );
      }
      let contactInfo = [];
      if (email) contactInfo.push(email);
      if (phone) contactInfo.push(phone);
      if (address) contactInfo.push(address);

      if (contactInfo.length > 0) {
        children.push(
          new Paragraph({
            text: contactInfo.join(" | "),
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          })
        );
      }
      if (linkedin)
        children.push(
          new Paragraph({
            text: `LinkedIn: ${linkedin}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
          })
        );
      if (portfolio)
        children.push(
          new Paragraph({
            text: `Portfolio: ${portfolio}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );
    }

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (
        type === "generated_cv" &&
        currentMode === "generator" &&
        language === "id"
      ) {
        const nameFromForm = cvFormData.namaLengkap;
        const emailFromForm = cvFormData.email;
        if (
          (nameFromForm &&
            trimmedLine.toUpperCase() === nameFromForm.toUpperCase()) ||
          (emailFromForm && trimmedLine.includes(emailFromForm))
        ) {
          continue;
        }
      }

      if (trimmedLine.startsWith("# ")) {
        children.push(
          new Paragraph({
            ...HEADING_1_STYLE,
            text: trimmedLine.substring(2),
            alignment:
              type === "generated_cv" &&
              currentMode === "generator" &&
              language === "id" &&
              children.length === 1
                ? AlignmentType.CENTER
                : AlignmentType.LEFT,
          })
        );
      } else if (trimmedLine.startsWith("## ")) {
        children.push(
          new Paragraph({ ...HEADING_2_STYLE, text: trimmedLine.substring(3) })
        );
      } else if (trimmedLine.startsWith("### ")) {
        children.push(
          new Paragraph({ ...HEADING_3_STYLE, text: trimmedLine.substring(4) })
        );
      } else if (trimmedLine.startsWith("* ") || trimmedLine.startsWith("- ")) {
        const textRuns = [];
        let currentText = trimmedLine.substring(2);
        const boldRegex = /\*\*(.*?)\*\*/g;
        let lastIndex = 0;
        let match;
        while ((match = boldRegex.exec(currentText)) !== null) {
          if (match.index > lastIndex)
            textRuns.push(
              new TextRun(currentText.substring(lastIndex, match.index))
            );
          textRuns.push(new TextRun({ text: match[1], bold: true }));
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < currentText.length)
          textRuns.push(new TextRun(currentText.substring(lastIndex)));
        children.push(new Paragraph({ children: textRuns, ...BULLET_STYLE }));
      } else if (trimmedLine) {
        const textRuns = [];
        const boldRegex = /\*\*(.*?)\*\*/g;
        let lastIndex = 0;
        let match;
        while ((match = boldRegex.exec(trimmedLine)) !== null) {
          if (match.index > lastIndex)
            textRuns.push(
              new TextRun(trimmedLine.substring(lastIndex, match.index))
            );
          textRuns.push(new TextRun({ text: match[1], bold: true }));
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < trimmedLine.length)
          textRuns.push(new TextRun(trimmedLine.substring(lastIndex)));
        children.push(
          new Paragraph({ children: textRuns, ...PARAGRAPH_STYLE })
        );
      } else {
        if (
          children.length > 0 &&
          children[children.length - 1] instanceof Paragraph
        ) {
          children[children.length - 1].addChildElement(
            new TextRun({ break: 1, text: "" })
          );
        }
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
          },
          children: children,
        },
      ],
      styles: {
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            run: { font: "Calibri", size: 22 },
            paragraph: { spacing: { line: 276 } },
          },
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: { size: 32, bold: true, font: "Calibri" },
            paragraph: {
              spacing: { before: 240, after: 120 },
              alignment: AlignmentType.CENTER,
            },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: { size: 26, bold: true, font: "Calibri" },
            paragraph: { spacing: { before: 200, after: 100 } },
          },
          {
            id: "Heading3",
            name: "Heading 3",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: { size: 24, bold: true, font: "Calibri Light" },
            paragraph: { spacing: { before: 160, after: 80 } },
          },
        ],
      },
    });

    try {
      const blob = await Packer.toBlob(doc);
      let suffix = "";
      const langSuffix = language === "en" ? "_en" : "";

      if (type === "review") {
        suffix = "_direview.docx";
      } else if (currentMode === "reviewer") {
        suffix = `_cv_optimal${langSuffix}.docx`;
      } else {
        suffix = `_cv_generated_form${langSuffix}.docx`;
      }
      const finalFileName = baseFileName.replace(/\.[^/.]+$/, "") + suffix;

      saveAs(blob, finalFileName);
      setDocxError(null);
    } catch (e) {
      console.error("Error generating DOCX:", e);
      const errorMsg =
        "Gagal membuat file DOCX. Coba lagi ya. " +
        (e instanceof Error ? e.message : "");
      setDocxError(errorMsg);
    }
  };

  const handleDownloadOriginalReviewDocx = () => {
    if (!review || !file) {
      setDocxError(
        "Tidak ada hasil review asli atau nama file yang bisa diunduh."
      );
      return;
    }
    createAndDownloadDocx(review, file.name, "review", "id");
  };

  const handleDownloadGeneratedCvFromFormDocx = () => {
    if (!generatedCvText) {
      setDocxError("Tidak ada CV yang dihasilkan dari form untuk diunduh.");
      return;
    }
    const baseFileName =
      cvFormData.namaLengkap.replace(/\s+/g, "_") || "CV_AI_Form";

    createAndDownloadDocx(
      generatedCvText,
      baseFileName,
      "generated_cv",
      selectedGenerationLanguage || "id"
    );
  };

  const isDirty =
    (currentMode === "reviewer" &&
      (file ||
        jobDescription.trim() !== "" ||
        review ||
        error ||
        docxError ||
        generatedOptimizedCvText ||
        optimizedCvError)) ||
    (currentMode === "generator" &&
      (JSON.stringify(cvFormData) !== JSON.stringify(initialCvFormData) ||
        generatedCvText ||
        cvGenerationError ||
        docxError));

  const commonBusyState =
    isLoading ||
    isGeneratingCv ||
    Object.values(isRefiningField).some((s) => s) ||
    isGeneratingOptimizedCv ||
    isTranslatingFormData ||
    showLanguageModal;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-8 selection:bg-sky-500 selection:text-white">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <AppHeader
          currentMode={currentMode}
          onShowResetModal={handleShowResetModal}
          showResetButton={isDirty && !commonBusyState}
          resetButtonDisabled={commonBusyState}
          onModeChange={handleModeChange}
        />

        <main className="w-full bg-slate-800 shadow-2xl rounded-lg p-6 sm:p-8">
          {currentMode === "reviewer" ? (
            <CvReviewerUI
              file={file}
              cvText={cvText}
              jobDescription={jobDescription}
              review={review}
              parsedReviewSections={parsedReviewSections}
              isLoading={isLoading}
              progress={progress}
              error={error}
              docxError={docxError}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              handleJobDescriptionChange={handleJobDescriptionChange}
              handleReviewCv={handleReviewCv}
              handleDownloadReviewDocx={handleDownloadOriginalReviewDocx}
              isGeneratingOptimizedCv={isGeneratingOptimizedCv}
              showLanguageModal={showLanguageModal}
              optimizedCvError={optimizedCvError}
              generatedOptimizedCvText={generatedOptimizedCvText}
              handleOpenLanguageModal={handleOpenLanguageModal}
              selectedGenerationLanguage={selectedGenerationLanguage}
            />
          ) : (
            <CvGeneratorUI
              showLanguageModal={showLanguageModal}
              isGeneratingCv={isGeneratingCv}
              isTranslatingFormData={isTranslatingFormData}
              handleOpenLanguageModal={handleOpenLanguageModal}
              cvFormData={cvFormData}
              handleCvFormInputChange={handleCvFormInputChange}
              addDynamicListItem={addDynamicListItem}
              handleDynamicListChange={handleDynamicListChange}
              removeDynamicListItem={removeDynamicListItem}
              selectedGenerationLanguage={selectedGenerationLanguage}
              cvGenerationError={cvGenerationError}
              handleDownloadGeneratedCvFromFormDocx={
                handleDownloadGeneratedCvFromFormDocx
              }
              docxError={docxError}
              currentMode={currentMode}
              generatedCvText={generatedCvText}
              isRefiningField={isRefiningField}
              handleRefineField={handleRefineField}
            />
          )}
        </main>

        {/* Footer */}
        <AppFooter />
      </div>

      <LanguageSelectionModal
        show={showLanguageModal}
        onClose={() => {
          setShowLanguageModal(false);
          setLanguageModalTrigger(null);
        }}
        onSelectLanguage={handleLanguageSelected}
        triggerContext={
          languageModalTrigger === "fromReview"
            ? "CV dari Review"
            : "CV dari Form"
        }
      />

      {/* Reset Confirmation Modal */}
      <ResetConfirmationModal
        show={showResetModal}
        onClose={handleCloseResetModal}
        onConfirm={handleFullReset}
      />
    </div>
  );
};

export default App;
