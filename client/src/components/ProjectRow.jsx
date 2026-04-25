import { FiEdit2, FiMenu, FiTrash2 } from 'react-icons/fi';

function ProjectRow({
  project,
  isExpanded,
  isDragging,
  dropIndicator,
  dragEnabled,
  onToggle,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) {
  const dropIndicatorClassName =
    dropIndicator === 'before'
      ? 'border-t-2 border-t-blue-500'
      : dropIndicator === 'after'
        ? 'border-b-2 border-b-blue-500'
        : '';

  return (
    <tr
      onClick={() => onToggle(project.id)}
      onDragOver={(event) => onDragOver(project.id, event)}
      onDrop={(event) => onDrop(project.id, event)}
      className={`cursor-pointer border-b border-slate-200 transition hover:bg-slate-50 dark:border-dark-border dark:hover:bg-slate-800/50 ${
        isExpanded ? 'bg-slate-50 dark:bg-slate-800/40' : ''
      } ${isDragging ? 'opacity-50' : ''} ${dropIndicatorClassName}`}
    >
      <td className="w-16 px-3 py-4 text-center text-sm text-slate-600 dark:text-dark-muted">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            draggable={dragEnabled}
            onClick={(event) => event.stopPropagation()}
            onDragStart={(event) => onDragStart(project.id, event)}
            onDragEnd={onDragEnd}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 transition dark:border-dark-border ${
              dragEnabled
                ? 'cursor-grab text-slate-500 hover:border-blue-400 hover:text-blue-600 active:cursor-grabbing dark:text-dark-muted'
                : 'cursor-not-allowed opacity-40 text-slate-400 dark:text-dark-muted'
            }`}
            aria-label={`${project.name || 'Project'} reorder`}
            title={dragEnabled ? '드래그해서 순서 바꾸기' : '순서를 바꾸려면 프로젝트가 2개 이상 있어야 합니다'}
          >
            <FiMenu />
          </button>
          <span>{project.no}</span>
        </div>
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
      <td className="px-3 py-4 text-sm text-slate-600 dark:text-dark-muted">
        {project.adminUrl ? (
          <a
            href={project.adminUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="block truncate text-blue-600 underline decoration-transparent transition hover:decoration-current dark:text-blue-300"
            title={project.adminUrl}
          >
            {project.adminUrl}
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
