import { FiEdit2, FiTrash2 } from 'react-icons/fi';

function ProjectRow({ project, isExpanded, onToggle, onEdit, onDelete }) {
  return (
    <tr
      onClick={() => onToggle(project.id)}
      className={`cursor-pointer border-b border-slate-200 transition hover:bg-slate-50 dark:border-dark-border dark:hover:bg-slate-800/50 ${
        isExpanded ? 'bg-slate-50 dark:bg-slate-800/40' : ''
      }`}
    >
      <td className="w-12 px-3 py-4 text-center text-sm text-slate-600 dark:text-dark-muted">
        {project.no}
      </td>
      <td
        className="w-64 px-3 py-4 text-sm font-medium text-slate-900 dark:text-dark-text"
        title={project.name || 'Untitled Project'}
      >
        <div className="truncate">{project.name || 'Untitled Project'}</div>
      </td>
      <td
        className="w-56 px-3 py-4 text-sm text-slate-600 dark:text-dark-muted"
        title={project.serverLocation || '-'}
      >
        <div className="truncate">{project.serverLocation || '-'}</div>
      </td>
      <td className="px-3 py-4 text-sm text-slate-600 dark:text-dark-muted">
        {project.url ? (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="block truncate text-blue-600 underline decoration-transparent transition hover:decoration-current dark:text-blue-300"
            title={project.url}
          >
            {project.url}
          </a>
        ) : (
          <span>-</span>
        )}
      </td>
      <td className="w-14 px-3 py-4 text-center">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(project);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-dark-border dark:text-dark-muted"
          aria-label={`${project.name} edit`}
        >
          <FiEdit2 />
        </button>
      </td>
      <td className="w-14 px-3 py-4 text-center">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(project);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-400 hover:text-red-600 dark:border-dark-border dark:text-dark-muted"
          aria-label={`${project.name} delete`}
        >
          <FiTrash2 />
        </button>
      </td>
    </tr>
  );
}

export default ProjectRow;
