import React, { useState } from "react";

export default function AdminPanel({ users, principalList, courses, onChangeRole, onApproveRejectCourse }) {
  const [targetPrincipal, setTargetPrincipal] = useState("");
  const [selectedRole, setSelectedRole] = useState("Student");

  return (
    <div className="panel admin-panel">
      <h2>Admin Dashboard</h2>
      {/* Assign Roles */}
      <section>
        <h3>Assign User Roles</h3>
        <input
          placeholder="Principal ID (e.g. 2vxsx‑fae)"
          value={targetPrincipal}
          onChange={e => setTargetPrincipal(e.target.value)}
        />
        <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
          <option>Student</option><option>Professor</option><option>Admin</option><option>Guest</option>
        </select>
        <button onClick={() => {
          onChangeRole(targetPrincipal, selectedRole);
          setTargetPrincipal("");
        }}>
          Assign Role
        </button>
      </section>

      {/* Users & Roles */}
      <section>
        <h3>All Users ({users.length})</h3>
        <ul>
          {users.map(u => (
            <li key={u.principal}>
              <strong>{u.principal}</strong> - {u.role}
            </li>
          ))}
        </ul>
      </section>

      {/* Course Approvals */}
      <section>
        <h3>Courses for Approval</h3>
        <ul>
          {courses.filter(c => ["Proposed","Voting"].includes(c.status)).map(c => (
            <li key={c.id}>
              <strong>{c.title}</strong> (ID: {c.id}) – {c.status} by {c.professor_id}
              <button onClick={() => onApproveRejectCourse(c.id, "Approved")}>Approve</button>
              <button onClick={() => onApproveRejectCourse(c.id, "Rejected")}>Reject</button>
            </li>
          ))}
        </ul>
      </section>

      {/* All Courses */}
      <section>
        <h3>All Courses ({courses.length})</h3>
        <ul>
          {courses.map(c => (
            <li key={c.id}>
              <strong>{c.title}</strong> (ID: {c.id}) – {c.status} by {c.professor_id}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
