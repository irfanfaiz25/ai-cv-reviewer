import React from "react";
import { SparklesIcon } from "../icons/SparklesIcon.jsx";
import { DownloadIcon } from "../icons/DownloadIcon.jsx";
import { PlusCircleIcon } from "../icons/PlusCircleIcon.jsx";
import { TrashIcon } from "../icons/TrashIcon.jsx";
import { PencilSquareIcon } from "../icons/PencilSquareIcon.jsx";
import { TEXT_REFINEMENT_PROMPT_TEMPLATES } from "../../../constants.js";

export const CvGeneratorUI = ({
  showLanguageModal,
  isGeneratingCv,
  isTranslatingFormData,
  handleOpenLanguageModal,
  cvFormData,
  handleCvFormInputChange,
  addDynamicListItem,
  handleDynamicListChange,
  removeDynamicListItem,
  selectedGenerationLanguage,
  cvGenerationError,
  handleDownloadGeneratedCvFromFormDocx,
  docxError,
  currentMode,
  generatedCvText,
  isRefiningField,
  handleRefineField,
}) => {
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
          <h3 className="text-lg md:text-xl font-semibold text-sky-300 mb-4">
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
          <h3 className="text-lg md:text-xl font-semibold text-sky-300 mb-4">
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
            <h3 className="text-lg md:text-xl font-semibold text-sky-300">
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
                  <label className={commonLabelClass}>Lokasi Perusahaan</label>
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
                onClick={() => removeDynamicListItem("pengalamanKerja", index)}
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
            <h3 className="text-lg md:text-xl font-semibold text-sky-300">
              Pendidikan
            </h3>
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
          <h3 className="text-lg md:text-xl font-semibold text-sky-300 mb-4">
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
            <h3 className="text-lg md:text-xl font-semibold text-sky-300">
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
            <h3 className="text-lg md:text-xl font-semibold text-sky-300">
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
              <p className="font-semibold">Error Unduh DOCX (CV dari Form):</p>
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
