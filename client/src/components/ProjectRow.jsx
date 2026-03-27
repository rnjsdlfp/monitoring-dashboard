import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import StatusLight from './StatusLight';

function ProjectRow({ project, isExpanded, onToggle, onEdit, onDelete, formatTimestamp }) {
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
      <td className="w-20 px-3 py-4 text-center">
        <StatusLight status={project.status?.server || 'na'} />
      </td>
      <td className="w-20 px-3 py-4 text-center">
        <StatusLight status={project.hasSchedule ? project.status?.schedule || 'yellow' : 'na'} />
      </td>
      <td className="w-16 px-3 py-4 text-center">
        <StatusLight status={project.hasDb ? project.status?.db || 'yellow' : 'na'} />
      </td>
      <td className="w-40 px-3 py-4 text-center text-sm text-slate-600 dark:text-dark-muted">
        {formatTimestamp(project.status?.lastUpdated)}
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
