import { Fragment, useEffect, useState } from 'react';
import AddEditModal from '../components/AddEditModal';
import ProjectAccordion from '../components/ProjectAccordion';
import ProjectRow from '../components/ProjectRow';

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

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
    const confirmed = window.confirm(`'${project.name}' 프로젝트를 삭제하시겠습니까?`);

    if (!confirmed) {
      return;
    }

    const reconfirmed = window.confirm(
      '정말로 삭제합니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?'
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

  return (
    <section className="min-h-full p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-text">
              Projects
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-dark-muted">
              프로젝트의 기본 운영 정보를 한눈에 보고, 상세 정보까지 펼쳐서 확인할 수 있습니다.
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
            새로운 Project 추가
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-dark-border dark:bg-dark-card">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead className="bg-slate-100 text-left dark:bg-slate-950/60">
                <tr className="text-sm font-semibold text-slate-700 dark:text-dark-text">
                  <th className="w-12 px-3 py-4 text-center">No.</th>
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
                      아직 등록된 프로젝트가 없습니다.
                    </td>
                  </tr>
                ) : null}

                {!loading
                  ? projects.map((project) => (
                      <Fragment key={project.id}>
                        <ProjectRow
                          project={project}
                          isExpanded={expandedRow === project.id}
                          onToggle={(id) => setExpandedRow((current) => (current === id ? null : id))}
                          onEdit={(selectedProject) => {
                            setEditingProject(selectedProject);
                            setShowModal(true);
                          }}
                          onDelete={handleDeleteProject}
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
