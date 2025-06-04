import React, { useState, useCallback, useEffect, useRef } from "react";
import { ProgressBar } from "./components/ProgressBar.jsx";
import {
  getCVReview,
  generateCvFromFormData,
  refineCvSectionText,
  generateOptimizedCvFromReview,
  translateCvFormDataToEnglish,
} from "./src/services/geminiService.js";
import { UploadIcon } from "./components/icons/UploadIcon.jsx";
import { SparklesIcon } from "./components/icons/SparklesIcon.jsx";
import { DocumentTextIcon } from "./components/icons/DocumentTextIcon.jsx";
import {
  CV_REVIEW_PROMPT_TEMPLATE,
  EXPECTED_SECTION_TITLES_ORDERED,
  TEXT_REFINEMENT_PROMPT_TEMPLATES,
} from "./constants.js";
import { DownloadIcon } from "./components/icons/DownloadIcon.jsx";
import { LightbulbIcon } from "./components/icons/LightbulbIcon.jsx";
import { ThumbUpIcon } from "./components/icons/ThumbUpIcon.jsx";
import { WrenchScrewdriverIcon } from "./components/icons/WrenchScrewdriverIcon.jsx";
import { ChatBubbleOvalLeftEllipsisIcon } from "./components/icons/ChatBubbleOvalLeftEllipsisIcon.jsx";
import { TargetIcon } from "./components/icons/TargetIcon.jsx";
import { ArrowPathIcon } from "./components/icons/ArrowPathIcon.jsx";
import { PlusCircleIcon } from "./components/icons/PlusCircleIcon.jsx";
import { TrashIcon } from "./components/icons/TrashIcon.jsx";
import { PencilSquareIcon } from "./components/icons/PencilSquareIcon.jsx";
import { EyeIcon } from "./components/icons/EyeIcon.jsx";
import { BriefcaseIcon } from "./components/icons/BriefcaseIcon.jsx";
import { LanguageSelectionModal } from "./src/components/modals/LanguageSelectionModal.jsx";

import { AppFooter } from "./src/components/layout/AppFooter.jsx";
import { AppHeader } from "./src/components/layout/AppHeader.jsx";

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

  const renderCvReviewer = () => (
    <>
      <div className="mb-6">
        <label
          htmlFor="cv-upload"
          className={`w-full flex items-center justify-center px-6 py-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            error && !file
              ? "border-red-500 hover:border-red-400"
              : "border-slate-600 hover:border-sky-500"
          } ${file ? "bg-slate-700" : "bg-slate-800 hover:bg-slate-700"}`}
        >
          <input
            type="file"
            id="cv-upload"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            disabled={isLoading || isGeneratingOptimizedCv || showLanguageModal}
          />
          <div className="text-center">
            {file ? (
              <>
                <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-sky-400" />
                <p className="text-slate-200 font-medium">{file.name}</p>
                <p className="text-xs text-slate-400">
                  Klik buat ganti file PDF
                </p>
              </>
            ) : (
              <>
                <UploadIcon className="w-12 h-12 mx-auto mb-3 text-slate-500 group-hover:text-sky-400 transition-colors" />
                <p className="text-slate-300 font-medium">
                  {error && !file
                    ? "Coba file lain deh"
                    : "Klik buat upload atau drag & drop CV (PDF)"}
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

      <div className="mb-6">
        <label
          htmlFor="job-description"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          Deskripsi Pekerjaan / Lowongan (Opsional, biar makin pas reviewnya!)
        </label>
        <textarea
          id="job-description"
          rows={4}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-slate-200 placeholder-slate-400 transition-colors"
          placeholder="Copy-paste deskripsi kerja atau requirement dari lowongan yang lo incer di sini..."
          value={jobDescription}
          onChange={handleJobDescriptionChange}
          disabled={isLoading || isGeneratingOptimizedCv || showLanguageModal}
        />
      </div>

      {file &&
        cvText &&
        !isLoading &&
        !review &&
        !isGeneratingOptimizedCv &&
        !error && (
          <button
            onClick={handleReviewCv}
            disabled={
              isLoading ||
              !cvText ||
              isGeneratingOptimizedCv ||
              showLanguageModal
            }
            className="w-full flex items-center justify-center bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-102 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            Review CV Gue Dong!
          </button>
        )}

      {isLoading && !isGeneratingOptimizedCv && (
        <div className="my-6">
          <p className="text-center text-sky-300 mb-2 text-lg font-medium">
            {progress < 10 && !cvText && file
              ? "Lagi baca PDF lo..."
              : "Sabar ya, CV lo lagi di-review AI..."}
          </p>
          <ProgressBar progress={progress} />
          <p className="text-center text-xs text-slate-400 mt-2">
            {progress}% Kelar
          </p>
        </div>
      )}

      {error && !isLoading && !isGeneratingOptimizedCv && !review && (
        <div className="my-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md shadow-lg">
          <p className="font-semibold text-lg">
            Waduh, ada error pas review nih:
          </p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {review &&
        parsedReviewSections.length > 0 &&
        !isLoading &&
        !isGeneratingOptimizedCv &&
        !error && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-3xl font-semibold text-center sm:text-left bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                Hasil Review CV Lo
              </h2>
              <button
                onClick={handleDownloadOriginalReviewDocx}
                disabled={isLoading || !review || showLanguageModal}
                title="Unduh teks review asli dalam format .docx"
                className="w-full sm:w-auto flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transform hover:scale-102 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Unduh Teks Review (.docx)
              </button>
            </div>

            {parsedReviewSections.map((section) => (
              <section
                key={section.id}
                aria-labelledby={section.id}
                className="bg-slate-700/70 p-4 sm:p-6 rounded-xl shadow-xl border border-slate-600/50"
              >
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="mr-3 sm:mr-4 shrink-0">{section.icon}</div>
                  <h3
                    id={section.id}
                    className="text-xl sm:text-2xl font-semibold text-sky-300"
                  >
                    {section.title}
                  </h3>
                </div>
                <div
                  className="prose prose-sm sm:prose-base prose-slate max-w-none 
                              prose-strong:text-slate-100 prose-em:text-slate-300 
                              prose-p:text-slate-300 prose-li:text-slate-300
                              prose-headings:text-sky-300"
                >
                  {section.contentBlocks.map((block, idx) =>
                    React.cloneElement(block, {
                      key: `${section.id}-block-${idx}`,
                    })
                  )}
                </div>
              </section>
            ))}
          </div>
        )}

      {review &&
        parsedReviewSections.length === 0 &&
        !isLoading &&
        !error &&
        !isGeneratingOptimizedCv && (
          <div className="mt-8 p-6 bg-slate-700/50 rounded-lg shadow-xl border border-slate-600">
            <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent">
              CV Review Feedback (Raw)
            </h2>
            <p className="text-sm text-amber-400 mb-2">
              Gagal mem-parsing review ke dalam sections, menampilkan mentahan:
            </p>
            <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed bg-slate-800 p-4 rounded-md max-h-[500px] overflow-y-auto">
              {review}
            </pre>
          </div>
        )}

      {review && cvText && !isLoading && !isGeneratingOptimizedCv && !error && (
        <div className="mt-8 pt-6 border-t border-slate-700">
          <button
            onClick={() => handleOpenLanguageModal("fromReview")}
            disabled={showLanguageModal || isGeneratingOptimizedCv}
            className="w-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-102 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            Mau saya buatkan perbaikan CV?
          </button>
        </div>
      )}

      {isGeneratingOptimizedCv && (
        <div className="my-6 pt-6 border-t border-slate-700">
          <p className="text-center text-purple-300 mb-2 text-lg font-medium">
            Lagi dioptimalkan sama AI jadi ATS-Friendly... Sabar ya!
          </p>
          <ProgressBar progress={50} />
        </div>
      )}

      {optimizedCvError && !isGeneratingOptimizedCv && (
        <div className="my-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md shadow-lg">
          <p className="font-semibold text-lg">
            Waduh, gagal memproses CV optimal:
          </p>
          <p className="mt-1 text-sm">{optimizedCvError}</p>
        </div>
      )}

      {docxError &&
        currentMode === "reviewer" &&
        generatedOptimizedCvText &&
        !isGeneratingOptimizedCv && (
          <div className="my-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md shadow-lg">
            <p className="font-semibold text-lg">
              Error Unduh DOCX untuk CV Optimal:
            </p>
            <p className="mt-1 text-sm">{docxError}</p>
          </div>
        )}

      {generatedOptimizedCvText &&
        !isGeneratingOptimizedCv &&
        !optimizedCvError && (
          <div className="mt-10 pt-6 border-t border-slate-600">
            <h3 className="text-2xl font-semibold text-purple-300 mb-4 text-center">
              Ini Dia CV Optimal Lo (
              {selectedGenerationLanguage === "en" ? "English" : "Indonesia"})!
            </h3>
            <p className="text-center text-slate-400 mb-4 text-sm">
              File .docx juga sudah otomatis terunduh jika tidak ada error.
            </p>
            <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed bg-slate-800 p-4 rounded-md max-h-[600px] overflow-y-auto border border-slate-600 shadow-inner">
              {generatedOptimizedCvText}
            </pre>
          </div>
        )}
      {!file && !isLoading && !review && !error && !isGeneratingOptimizedCv && (
        <div className="text-center text-slate-500 py-10">
          <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Upload dulu CV lo biar bisa di-review.</p>
          <p className="text-xs mt-1">( inget ya, cuma file .pdf )</p>
        </div>
      )}
    </>
  );

  const renderCvGenerator = () => {
    const commonInputClass =
      "w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-slate-200 placeholder-slate-400 transition-colors disabled:opacity-60";
    const commonTextareaClass = `${commonInputClass} min-h-[100px]`;
    const commonLabelClass = "block text-sm font-medium text-slate-300 mb-1.5";
    const refineButtonClass =
      "mt-2 flex items-center text-sm text-sky-400 hover:text-sky-300 disabled:opacity-50 disabled:cursor-wait";

    const generatorBusyState =
      showLanguageModal || isGeneratingCv || isTranslatingFormData;

    const renderRefineButton = (
      fieldId,
      sectionType,
      textToRefine,
      itemIndex,
      labelOverride
    ) => (
      <button
        type="button"
        onClick={() =>
          handleRefineField(fieldId, sectionType, textToRefine, itemIndex)
        }
        disabled={
          isRefiningField[fieldId] || !textToRefine.trim() || generatorBusyState
        }
        className={refineButtonClass}
        title={`Perbaiki ${
          labelOverride ||
          (fieldId.includes("_") ? fieldId.split("_").pop() : fieldId)
        } dengan AI`}
      >
        {isRefiningField[fieldId] ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-400 mr-2"></div>
            Memperbaiki...
          </>
        ) : (
          <>
            <PencilSquareIcon className="w-4 h-4 mr-1.5" />
            Perbaiki dengan AI
          </>
        )}
      </button>
    );

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleOpenLanguageModal("fromForm");
        }}
      >
        <div className="space-y-8">
          <section className="p-6 bg-slate-700/50 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-sky-300 mb-4">
              Informasi Pribadi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label htmlFor="namaLengkap" className={commonLabelClass}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="namaLengkap"
                  id="namaLengkap"
                  value={cvFormData.namaLengkap}
                  onChange={handleCvFormInputChange}
                  className={commonInputClass}
                  required
                  disabled={generatorBusyState}
                />
              </div>
              <div>
                <label htmlFor="email" className={commonLabelClass}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={cvFormData.email}
                  onChange={handleCvFormInputChange}
                  className={commonInputClass}
                  required
                  disabled={generatorBusyState}
                />
              </div>
              <div>
                <label htmlFor="nomorTelepon" className={commonLabelClass}>
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  name="nomorTelepon"
                  id="nomorTelepon"
                  value={cvFormData.nomorTelepon}
                  onChange={handleCvFormInputChange}
                  className={commonInputClass}
                  required
                  disabled={generatorBusyState}
                />
              </div>
              <div>
                <label htmlFor="alamatSingkat" className={commonLabelClass}>
                  Alamat Singkat (Kota, Provinsi)
                </label>
                <input
                  type="text"
                  name="alamatSingkat"
                  id="alamatSingkat"
                  value={cvFormData.alamatSingkat}
                  onChange={handleCvFormInputChange}
                  className={commonInputClass}
                  disabled={generatorBusyState}
                />
              </div>
              <div>
                <label htmlFor="linkedinUrl" className={commonLabelClass}>
                  URL LinkedIn (Opsional)
                </label>
                <input
                  type="url"
                  name="linkedinUrl"
                  id="linkedinUrl"
                  value={cvFormData.linkedinUrl}
                  onChange={handleCvFormInputChange}
                  className={commonInputClass}
                  placeholder="https://linkedin.com/in/..."
                  disabled={generatorBusyState}
                />
              </div>
              <div>
                <label htmlFor="portfolioUrl" className={commonLabelClass}>
                  URL Portfolio/Website (Opsional)
                </label>
                <input
                  type="url"
                  name="portfolioUrl"
                  id="portfolioUrl"
                  value={cvFormData.portfolioUrl}
                  onChange={handleCvFormInputChange}
                  className={commonInputClass}
                  placeholder="https://..."
                  disabled={generatorBusyState}
                />
              </div>
            </div>
          </section>

          <section className="p-6 bg-slate-700/50 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-sky-300 mb-4">
              Ringkasan Profil
            </h3>
            <textarea
              name="ringkasanProfil"
              id="ringkasanProfil"
              value={cvFormData.ringkasanProfil}
              onChange={handleCvFormInputChange}
              className={commonTextareaClass}
              placeholder="Tulis ringkasan profil profesional Anda di sini..."
              rows={4}
              disabled={generatorBusyState}
            ></textarea>
            {renderRefineButton(
              "ringkasanProfil",
              "PROFILE_SUMMARY",
              cvFormData.ringkasanProfil,
              undefined,
              "Ringkasan Profil"
            )}
          </section>

          <section className="p-6 bg-slate-700/50 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-sky-300">
                Pengalaman Kerja / Magang
              </h3>
              <button
                type="button"
                onClick={() =>
                  addDynamicListItem("pengalamanKerja", {
                    id: Date.now().toString(),
                    posisi: "",
                    namaPerusahaan: "",
                    lokasiPerusahaan: "",
                    tanggalMulai: "",
                    tanggalSelesai: "",
                    deskripsiPekerjaan: "",
                    isRefining: false,
                  })
                }
                className="flex items-center text-sm text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={generatorBusyState}
              >
                <PlusCircleIcon className="w-5 h-5 mr-1.5" /> Tambah Pengalaman
              </button>
            </div>
            {cvFormData.pengalamanKerja.map((exp, index) => (
              <div
                key={exp.id}
                className="p-4 border border-slate-600 rounded-lg mb-4 space-y-3 bg-slate-800/30"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <label className={commonLabelClass}>Posisi</label>
                    <input
                      type="text"
                      value={exp.posisi}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "pengalamanKerja",
                          index,
                          "posisi",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      required
                      disabled={generatorBusyState}
                    />
                  </div>
                  <div>
                    <label className={commonLabelClass}>Nama Perusahaan</label>
                    <input
                      type="text"
                      value={exp.namaPerusahaan}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "pengalamanKerja",
                          index,
                          "namaPerusahaan",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      required
                      disabled={generatorBusyState}
                    />
                  </div>
                  <div>
                    <label className={commonLabelClass}>
                      Lokasi Perusahaan
                    </label>
                    <input
                      type="text"
                      value={exp.lokasiPerusahaan}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "pengalamanKerja",
                          index,
                          "lokasiPerusahaan",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      disabled={generatorBusyState}
                    />
                  </div>
                  <div>
                    <label className={commonLabelClass}>
                      Tanggal Mulai (Bulan Tahun)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jan 2020"
                      value={exp.tanggalMulai}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "pengalamanKerja",
                          index,
                          "tanggalMulai",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      disabled={generatorBusyState}
                    />
                  </div>
                  <div>
                    <label className={commonLabelClass}>
                      Tanggal Selesai (Bulan Tahun / Sekarang)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Des 2021 atau Sekarang"
                      value={exp.tanggalSelesai}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "pengalamanKerja",
                          index,
                          "tanggalSelesai",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      disabled={generatorBusyState}
                    />
                  </div>
                </div>
                <div>
                  <label className={commonLabelClass}>
                    Deskripsi Pekerjaan & Pencapaian
                  </label>
                  <textarea
                    value={exp.deskripsiPekerjaan}
                    onChange={(e) =>
                      handleDynamicListChange(
                        "pengalamanKerja",
                        index,
                        "deskripsiPekerjaan",
                        e.target.value
                      )
                    }
                    className={commonTextareaClass}
                    rows={5}
                    placeholder="Jelaskan tanggung jawab dan pencapaian utama Anda. Gunakan poin-poin dan kata kerja aksi."
                    disabled={generatorBusyState}
                  ></textarea>
                  {renderRefineButton(
                    `pengalamanKerja_${index}_deskripsiPekerjaan`,
                    "WORK_EXPERIENCE_DESCRIPTION",
                    exp.deskripsiPekerjaan,
                    index,
                    "Deskripsi Pekerjaan"
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    removeDynamicListItem("pengalamanKerja", index)
                  }
                  className="flex items-center text-sm text-red-400 hover:text-red-300 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={generatorBusyState}
                >
                  <TrashIcon className="w-4 h-4 mr-1.5" /> Hapus Pengalaman Ini
                </button>
              </div>
            ))}
          </section>

          <section className="p-6 bg-slate-700/50 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-sky-300">Pendidikan</h3>
              <button
                type="button"
                onClick={() =>
                  addDynamicListItem("pendidikan", {
                    id: Date.now().toString(),
                    namaInstitusi: "",
                    gelar: "",
                    bidangStudi: "",
                    tanggalLulus: "",
                    deskripsiPendidikan: "",
                    isRefining: false,
                  })
                }
                className="flex items-center text-sm text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={generatorBusyState}
              >
                <PlusCircleIcon className="w-5 h-5 mr-1.5" /> Tambah Pendidikan
              </button>
            </div>
            {cvFormData.pendidikan.map((edu, index) => (
              <div
                key={edu.id}
                className="p-4 border border-slate-600 rounded-lg mb-4 space-y-3 bg-slate-800/30"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <label className={commonLabelClass}>Nama Institusi</label>
                    <input
                      type="text"
                      value={edu.namaInstitusi}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "pendidikan",
                          index,
                          "namaInstitusi",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      required
                      disabled={generatorBusyState}
                    />
                  </div>
                  <div>
                    <label className={commonLabelClass}>Gelar</label>
                    <input
                      type="text"
                      value={edu.gelar}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "pendidikan",
                          index,
                          "gelar",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      disabled={generatorBusyState}
                    />
                  </div>
                  <div>
                    <label className={commonLabelClass}>Bidang Studi</label>
                    <input
                      type="text"
                      value={edu.bidangStudi}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "pendidikan",
                          index,
                          "bidangStudi",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      disabled={generatorBusyState}
                    />
                  </div>
                  <div>
                    <label className={commonLabelClass}>
                      Tanggal Lulus (Bulan Tahun)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jul 2019"
                      value={edu.tanggalLulus}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "pendidikan",
                          index,
                          "tanggalLulus",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      disabled={generatorBusyState}
                    />
                  </div>
                </div>
                <div>
                  <label className={commonLabelClass}>
                    Deskripsi Tambahan (Opsional)
                  </label>
                  <textarea
                    value={edu.deskripsiPendidikan}
                    onChange={(e) =>
                      handleDynamicListChange(
                        "pendidikan",
                        index,
                        "deskripsiPendidikan",
                        e.target.value
                      )
                    }
                    className={commonTextareaClass}
                    rows={3}
                    placeholder="Misal: IPK, tesis, kegiatan relevan, penghargaan akademik."
                    disabled={generatorBusyState}
                  ></textarea>
                  {renderRefineButton(
                    `pendidikan_${index}_deskripsiPendidikan`,
                    "EDUCATION_DETAILS",
                    edu.deskripsiPendidikan,
                    index,
                    "Deskripsi Pendidikan"
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeDynamicListItem("pendidikan", index)}
                  className="flex items-center text-sm text-red-400 hover:text-red-300 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={generatorBusyState}
                >
                  <TrashIcon className="w-4 h-4 mr-1.5" /> Hapus Pendidikan Ini
                </button>
              </div>
            ))}
          </section>

          <section className="p-6 bg-slate-700/50 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-sky-300 mb-4">
              Keterampilan
            </h3>
            <textarea
              name="keterampilan"
              id="keterampilan"
              value={cvFormData.keterampilan}
              onChange={handleCvFormInputChange}
              className={commonTextareaClass}
              placeholder="Sebutkan keterampilan teknis dan non-teknis Anda, pisahkan dengan koma. Contoh: JavaScript, React, Manajemen Proyek, Komunikasi Tim"
              rows={4}
              disabled={generatorBusyState}
            ></textarea>
            {renderRefineButton(
              "keterampilan",
              "SKILLS",
              cvFormData.keterampilan,
              undefined,
              "Keterampilan"
            )}
          </section>

          <section className="p-6 bg-slate-700/50 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-sky-300">
                Pengalaman Organisasi (Opsional)
              </h3>
              <button
                type="button"
                onClick={() =>
                  addDynamicListItem("pengalamanOrganisasi", {
                    id: Date.now().toString(),
                    namaOrganisasi: "",
                    posisi: "",
                    periode: "",
                    deskripsiKegiatan: "",
                  })
                }
                className="flex items-center text-sm text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={generatorBusyState}
              >
                <PlusCircleIcon className="w-5 h-5 mr-1.5" /> Tambah Organisasi
              </button>
            </div>
            {cvFormData.pengalamanOrganisasi.map((org, index) => (
              <div
                key={org.id}
                className="p-4 border border-slate-600 rounded-lg mb-4 space-y-3 bg-slate-800/30"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <label className={commonLabelClass}>Nama Organisasi</label>
                    <input
                      type="text"
                      value={org.namaOrganisasi}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "pengalamanOrganisasi",
                          index,
                          "namaOrganisasi",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      disabled={generatorBusyState}
                    />
                  </div>
                  <div>
                    <label className={commonLabelClass}>Posisi</label>
                    <input
                      type="text"
                      value={org.posisi}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "pengalamanOrganisasi",
                          index,
                          "posisi",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      disabled={generatorBusyState}
                    />
                  </div>
                  <div>
                    <label className={commonLabelClass}>
                      Periode (Contoh: 2020-2021)
                    </label>
                    <input
                      type="text"
                      value={org.periode}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "pengalamanOrganisasi",
                          index,
                          "periode",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      disabled={generatorBusyState}
                    />
                  </div>
                </div>
                <div>
                  <label className={commonLabelClass}>Deskripsi Kegiatan</label>
                  <textarea
                    value={org.deskripsiKegiatan}
                    onChange={(e) =>
                      handleDynamicListChange(
                        "pengalamanOrganisasi",
                        index,
                        "deskripsiKegiatan",
                        e.target.value
                      )
                    }
                    className={commonTextareaClass}
                    rows={3}
                    disabled={generatorBusyState}
                  ></textarea>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    removeDynamicListItem("pengalamanOrganisasi", index)
                  }
                  className="flex items-center text-sm text-red-400 hover:text-red-300 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={generatorBusyState}
                >
                  <TrashIcon className="w-4 h-4 mr-1.5" /> Hapus Organisasi Ini
                </button>
              </div>
            ))}
          </section>

          <section className="p-6 bg-slate-700/50 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-sky-300">
                Penghargaan & Sertifikasi (Opsional)
              </h3>
              <button
                type="button"
                onClick={() =>
                  addDynamicListItem("penghargaanSertifikasi", {
                    id: Date.now().toString(),
                    namaPenghargaan: "",
                    pemberi: "",
                    tahunDiterima: "",
                  })
                }
                className="flex items-center text-sm text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={generatorBusyState}
              >
                <PlusCircleIcon className="w-5 h-5 mr-1.5" /> Tambah
                Penghargaan/Sertifikasi
              </button>
            </div>
            {cvFormData.penghargaanSertifikasi.map((award, index) => (
              <div
                key={award.id}
                className="p-4 border border-slate-600 rounded-lg mb-4 space-y-3 bg-slate-800/30"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <label className={commonLabelClass}>
                      Nama Penghargaan/Sertifikasi
                    </label>
                    <input
                      type="text"
                      value={award.namaPenghargaan}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "penghargaanSertifikasi",
                          index,
                          "namaPenghargaan",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      disabled={generatorBusyState}
                    />
                  </div>
                  <div>
                    <label className={commonLabelClass}>Pemberi</label>
                    <input
                      type="text"
                      value={award.pemberi}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "penghargaanSertifikasi",
                          index,
                          "pemberi",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      disabled={generatorBusyState}
                    />
                  </div>
                  <div>
                    <label className={commonLabelClass}>Tahun Diterima</label>
                    <input
                      type="text"
                      placeholder="Contoh: 2022"
                      value={award.tahunDiterima}
                      onChange={(e) =>
                        handleDynamicListChange(
                          "penghargaanSertifikasi",
                          index,
                          "tahunDiterima",
                          e.target.value
                        )
                      }
                      className={commonInputClass}
                      disabled={generatorBusyState}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    removeDynamicListItem("penghargaanSertifikasi", index)
                  }
                  className="flex items-center text-sm text-red-400 hover:text-red-300 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={generatorBusyState}
                >
                  <TrashIcon className="w-4 h-4 mr-1.5" /> Hapus Item Ini
                </button>
              </div>
            ))}
          </section>

          <div className="mt-8">
            {cvGenerationError && (
              <div className="my-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md shadow">
                <p className="font-semibold">Error Generate CV dari Form:</p>
                <p className="text-sm">{cvGenerationError}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={
                generatorBusyState ||
                Object.values(isRefiningField).some((s) => s)
              }
              className="w-full flex items-center justify-center bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-102 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTranslatingFormData ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Menerjemahkan Data Form...
                </>
              ) : isGeneratingCv ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sedang Membuat CV...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Generate CV ATS-Friendly dengan AI
                </>
              )}
            </button>
          </div>
        </div>

        {generatedCvText && !isGeneratingCv && !isTranslatingFormData && (
          <div className="mt-10 p-6 bg-slate-700/50 rounded-xl shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
              <h3 className="text-xl sm:text-2xl font-semibold text-sky-300 text-center sm:text-left">
                CV Berhasil Dibuat (
                {selectedGenerationLanguage === "en" ? "English" : "Indonesia"}
                )!
              </h3>
              <button
                onClick={handleDownloadGeneratedCvFromFormDocx}
                disabled={isGeneratingCv || isTranslatingFormData}
                className="w-full sm:w-auto flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Unduh CV (.docx)
              </button>
            </div>
            {docxError && currentMode === "generator" && (
              <div className="my-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md shadow">
                <p className="font-semibold">
                  Error Unduh DOCX (CV dari Form):
                </p>
                <p className="text-sm">{docxError}</p>
              </div>
            )}
            <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed bg-slate-800 p-4 rounded-md max-h-[600px] overflow-y-auto border border-slate-600">
              {generatedCvText}
            </pre>
          </div>
        )}
      </form>
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

        {/* <header className="text-center mb-8 sm:mb-12">
          <div className="flex justify-between items-center mb-2">
            <div className="w-1/3"></div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent w-auto text-center whitespace-nowrap px-4">
              AI CV Suite
            </h1>
            <div className="w-1/3 flex justify-end">
              {isDirty && !commonBusyState && (
                <button
                  onClick={handleShowResetModal}
                  title="Reset Form"
                  className="p-2 rounded-md text-slate-400 hover:text-sky-400 hover:bg-slate-700 transition-colors"
                  disabled={commonBusyState}
                >
                  <ArrowPathIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
          <p
            className="mt-1 text-slate-400 text-lg"
            dangerouslySetInnerHTML={{
              __html:
                currentMode === "reviewer"
                  ? "Upload CV .pdf lo, biar di-review & di-upgrade sama AI!"
                  : "Isi form di bawah buat bikin CV ATS-Friendly pake bantuan AI!",
            }}
          ></p>
          <div className="mt-6 flex justify-center space-x-3 sm:space-x-4">
            <button
              onClick={() => handleModeChange("reviewer")}
              disabled={commonBusyState}
              className={`px-4 py-2.5 sm:px-6 rounded-lg font-medium transition-all duration-200 ease-in-out flex items-center ${
                currentMode === "reviewer"
                  ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg scale-105"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300"
              }`}
            >
              <EyeIcon className="w-5 h-5 mr-2" /> CV Reviewer
            </button>
            <button
              onClick={() => handleModeChange("generator")}
              disabled={commonBusyState}
              className={`px-4 py-2.5 sm:px-6 rounded-lg font-medium transition-all duration-200 ease-in-out flex items-center ${
                currentMode === "generator"
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg scale-105"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300"
              }`}
            >
              <BriefcaseIcon className="w-5 h-5 mr-2" /> CV Generator
            </button>
          </div>
        </header> */}

        <main className="w-full bg-slate-800 shadow-2xl rounded-lg p-6 sm:p-8">
          {currentMode === "reviewer"
            ? renderCvReviewer()
            : renderCvGenerator()}
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

      {showResetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
            <h3 className="text-2xl font-semibold text-sky-300 mb-4">
              Konfirmasi Reset
            </h3>
            <p className="text-slate-300 mb-6">
              Yakin mau reset semua input dan hasil di mode ini? Data yang udah
              lo masukin bakal ilang lho.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCloseResetModal}
                className="px-6 py-2.5 rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleFullReset}
                className="px-6 py-2.5 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors font-semibold"
              >
                Ya, Reset Aja!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
