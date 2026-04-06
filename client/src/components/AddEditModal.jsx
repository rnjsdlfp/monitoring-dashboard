import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';

const emptyForm = {
  name: '',
  description: '',
  outputFormat: '',
  serverLocation: '',
  url: '',
  techStack: []
};

function normalizeProject(project) {
  if (!project) {
    return emptyForm;
  }

  return {
    name: project.name || '',
    description: project.description || '',
    outputFormat: project.outputFormat || '',
    serverLocation: project.serverLocation || '',
    url: project.url || '',
    techStack: Array.isArray(project.techStack) ? project.techStack : []
  };
}

function AddEditModal({ isOpen, onClose, onSave, project }) {
  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(normalizeProject(project));
      setTagInput('');
      setSaving(false);
    }
  }, [isOpen, project]);

  function addTag(rawValue) {
    const value = rawValue.trim();

    if (!value || form.techStack.includes(value)) {
      return;
    }

    setForm((current) => ({
      ...current,
      techStack: [...current.techStack, value]
    }));
  }

  function removeTag(tag) {
    setForm((current) => ({
      ...current,
      techStack: current.techStack.filter((item) => item !== tag)
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      await onSave(form);
      onClose();
    } catch (error) {
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  const inputClassName =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-dark-border dark:bg-slate-900 dark:text-dark-text';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-2xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-dark-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text">
              {project ? 'Project 수정' : '새로운 Project 추가'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-dark-muted">
              지금 화면에서는 프로젝트 기본 정보만 입력합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:text-slate-900 dark:border-dark-border dark:text-dark-muted dark:hover:text-dark-text"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-dark-text">Project Name</span>
              <input
                className={inputClassName}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-dark-text">Description</span>
              <textarea
                rows="3"
                className={inputClassName}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-dark-text">Output Format</span>
              <input
                className={inputClassName}
                value={form.outputFormat}
                onChange={(event) =>
                  setForm((current) => ({ ...current, outputFormat: event.target.value }))
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-dark-text">Server Location</span>
              <input
                className={inputClassName}
                value={form.serverLocation}
                onChange={(event) =>
                  setForm((current) => ({ ...current, serverLocation: event.target.value }))
                }
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-dark-text">URL</span>
              <input
                className={inputClassName}
                value={form.url}
                onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-dark-text">Tech Stack</span>
              <div className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-dark-border">
                <div className="mb-3 flex flex-wrap gap-2">
                  {form.techStack.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300"
                    >
                      {tag} x
                    </button>
                  ))}
                </div>
                <input
                  className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-dark-text"
                  placeholder="Enter 또는 쉼표(,)로 태그 추가"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ',') {
                      event.preventDefault();
                      addTag(tagInput.replace(',', ''));
                      setTagInput('');
                    }
                  }}
                  onBlur={() => {
                    addTag(tagInput);
                    setTagInput('');
                  }}
                />
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-dark-border dark:text-dark-text dark:hover:bg-slate-900"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditModal;
