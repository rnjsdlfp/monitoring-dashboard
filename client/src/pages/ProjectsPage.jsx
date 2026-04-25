import { Fragment, useEffect, useState } from 'react';
import AddEditModal from '../components/AddEditModal';
import ProjectAccordion from '../components/ProjectAccordion';
import ProjectRow from '../components/ProjectRow';

const emptyDragState = {
  draggedProjectId: null,
  targetProjectId: null,
  position: 'before'
};

function getDropPosition(event) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const midpoint = bounds.top + bounds.height / 2;
  return event.clientY < midpoint ? 'before' : 'after';
}

function moveProject(projects, draggedProjectId, targetProjectId, position) {
  if (!draggedProjectId || !targetProjectId || draggedProjectId === targetProjectId) {
    return { changed: false, nextProjects: projects };
  }

  const draggedIndex = projects.findIndex((project) => project.id === draggedProjectId);
  const targetIndex = projects.findIndex((project) => project.id === targetProjectId);

  if (draggedIndex === -1 || targetIndex === -1) {
    return { changed: false, nextProjects: projects };
  }

  const reorderedProjects = [...projects];
  const [draggedProject] = reorderedProjects.splice(draggedIndex, 1);
  const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
  const insertIndex = position === 'after' ? adjustedTargetIndex + 1 : adjustedTargetIndex;

  reorderedProjects.splice(insertIndex, 0, draggedProject);

  const changed = reorderedProjects.some((project, index) => project.id !== projects[index]?.id);

  return {
    changed,
    nextProjects: reorderedProjects.map((project, index) => ({
      ...project,
      no: index + 1
    }))
  };
}

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [dragState, setDragState] = useState(emptyDragState);
  const [savingOrder, setSavingOrder] = useState(false);

  async function loadProjects() {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
    const intervalId = window.setInterval(loadProjects, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  async function handleSaveProject(formData) {
    const isEditing = Boolean(editingProject);
    const url = isEditing ? `/api/projects/${editingProject.id}` : '/api/projects';
    const method = isEditing ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error('Failed to save project');
    }

    await loadProjects();
    window.dispatchEvent(new Event('projects-updated'));
  }

  async function handleDeleteProject(project) {
    const confirmed = window.confirm(`'${project.name}' 프로젝트를 삭제할까요?`);

    if (!confirmed) {
      return;
    }

    const reconfirmed = window.confirm(
      '이 작업은 되돌릴 수 없습니다. 계속할까요?'
    );

    if (!reconfirmed) {
      return;
    }

    const response = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });

    if (!response.ok) {
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
      return;
    }

    if (expandedRow === project.id) {
      setExpandedRow(null);
    }

    await loadProjects();
    window.dispatchEvent(new Event('projects-updated'));
  }

  async function persistProjectOrder(nextProjects, previousProjects) {
    setSavingOrder(true);

    try {
      const response = await fetch('/api/projects/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderedIds: nextProjects.map((project) => project.id)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save project order');
      }

      const data = await response.json();
      setProjects(Array.isArray(data) ? data : nextProjects);
      window.dispatchEvent(new Event('projects-updated'));
    } catch (error) {
      setProjects(previousProjects);
      alert('순서 저장에 실패했습니다. 다시 시도해주세요.');
      await loadProjects();
    } finally {
      setSavingOrder(false);
    }
  }

  function handleDragStart(projectId, event) {
    if (savingOrder) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', projectId);
    setDragState({
      draggedProjectId: projectId,
      targetProjectId: null,
      position: 'before'
    });
  }

  function handleDragOver(projectId, event) {
    if (savingOrder || !dragState.draggedProjectId || dragState.draggedProjectId === projectId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const position = getDropPosition(event);

    setDragState((current) => {
      if (current.targetProjectId === projectId && current.position === position) {
        return current;
      }

      return {
        ...current,
        targetProjectId: projectId,
        position
      };
    });
  }

  async function handleDrop(projectId, event) {
    event.preventDefault();

    if (savingOrder) {
      return;
    }

    const draggedProjectId = dragState.draggedProjectId || event.dataTransfer.getData('text/plain');
    const position = getDropPosition(event);
    const previousProjects = projects;
    const { changed, nextProjects } = moveProject(previousProjects, draggedProjectId, projectId, position);

    setDragState(emptyDragState);

    if (!changed) {
      return;
    }

    setProjects(nextProjects);
    await persistProjectOrder(nextProjects, previousProjects);
  }

  function handleDragEnd() {
    setDragState(emptyDragState);
  }

  const dragEnabled = !loading && !savingOrder && projects.length > 1;

  return (
    <section className="min-h-full p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-text">
              Projects
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-dark-muted">
              저장된 프로젝트를 한눈에 보고, 행을 펼쳐서 상세 정보까지 확인할 수 있습니다.
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-dark-muted">
              {savingOrder
                ? '새 순서를 저장하는 중입니다...'
                : projects.length > 1
                  ? '왼쪽 핸들을 끌어 순서를 바꾸면 즉시 저장됩니다.'
                  : '드래그 정렬을 쓰려면 프로젝트가 2개 이상 있어야 합니다.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingProject(null);
              setShowModal(true);
            }}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            새 Project 추가
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-dark-border dark:bg-dark-card">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead className="bg-slate-100 text-left dark:bg-slate-950/60">
                <tr className="text-sm font-semibold text-slate-700 dark:text-dark-text">
                  <th className="w-16 px-3 py-4 text-center">Order</th>
                  <th className="w-64 px-3 py-4">Project Name</th>
                  <th className="w-56 px-3 py-4">Server Location</th>
                  <th className="px-3 py-4">URL</th>
                  <th className="px-3 py-4">URL(Admin)</th>
                  <th className="w-14 px-3 py-4 text-center">Edit</th>
                  <th className="w-14 px-3 py-4 text-center">Delete</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-slate-500 dark:text-dark-muted"
                    >
                      프로젝트 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                ) : null}

                {!loading && !projects.length ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-slate-500 dark:text-dark-muted"
                    >
                      아직 저장된 프로젝트가 없습니다.
                    </td>
                  </tr>
                ) : null}

                {!loading
                  ? projects.map((project) => (
                      <Fragment key={project.id}>
                        <ProjectRow
                          project={project}
                          isExpanded={expandedRow === project.id}
                          isDragging={dragState.draggedProjectId === project.id}
                          dropIndicator={
                            dragState.targetProjectId === project.id ? dragState.position : null
                          }
                          dragEnabled={dragEnabled}
                          onToggle={(id) => setExpandedRow((current) => (current === id ? null : id))}
                          onEdit={(selectedProject) => {
                            setEditingProject(selectedProject);
                            setShowModal(true);
                          }}
                          onDelete={handleDeleteProject}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onDragEnd={handleDragEnd}
                        />
                        <ProjectAccordion project={project} isOpen={expandedRow === project.id} />
                      </Fragment>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddEditModal
        isOpen={showModal}
        project={editingProject}
        onClose={() => {
          setShowModal(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
      />
    </section>
  );
}

export default ProjectsPage;
