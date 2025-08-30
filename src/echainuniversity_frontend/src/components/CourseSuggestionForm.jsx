import React, { useState } from "react";
import { toast } from "react-hot-toast";

export default function CourseSuggestionForm({ onSuggestionCourse }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const handle = () => {
    if (!title || !desc) return toast.error("Both title & description are required");
    onSuggestionCourse(title, desc);
    setTitle("");
    setDesc("");
  };

  return (
    <div className="course-form panel">
      <h3>Suggest New Course</h3>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" />
      <button onClick={handle}>Suggest Course</button>
    </div>
  );
}
