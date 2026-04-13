function ProjectAccordion({ project, isOpen }) {
  const fields = [
    { label: 'Project Description', value: project.description || 'No description' },
    { label: 'Output Format', value: project.outputFormat || 'Not set' },
    { label: 'Server Location', value: project.serverLocation || 'Not set' }
  ];

  return (
    <tr className="border-b border-slate-200 dark:border-dark-border">
      <td colSpan={7} className="p-0">
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isOpen ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-slate-100/80 px-6 py-5 dark:bg-slate-950/40">
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((field) => (
                <div
                  key={field.label}
                  className="rounded-2xl bg-white/90 p-4 shadow-sm dark:bg-slate-900/70"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    {field.label}
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-dark-text">{field.value}</p>
                </div>
              ))}

              <div className="rounded-2xl bg-white/90 p-4 shadow-sm dark:bg-slate-900/70">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  URL
                </p>
                {project.url ? (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block break-all text-sm text-blue-600 underline decoration-transparent transition hover:decoration-current dark:text-blue-300"
                  >
                    {project.url}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-slate-700 dark:text-dark-text">Not set</p>
                )}
              </div>

              <div className="rounded-2xl bg-white/90 p-4 shadow-sm dark:bg-slate-900/70">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  URL(Admin)
                </p>
                {project.adminUrl ? (
                  <a
                    href={project.adminUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block break-all text-sm text-blue-600 underline decoration-transparent transition hover:decoration-current dark:text-blue-300"
                  >
                    {project.adminUrl}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-slate-700 dark:text-dark-text">Not set</p>
                )}
              </div>

              <div className="rounded-2xl bg-white/90 p-4 shadow-sm dark:bg-slate-900/70 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  Tech Stack
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.techStack?.length ? (
                    project.techStack.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-700 dark:text-dark-text">Not set</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default ProjectAccordion;
