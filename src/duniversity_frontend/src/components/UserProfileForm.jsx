import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function UserProfileForm({ principalText, currentProfile, onSubmit }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [github, setGithub] = useState("");

  useEffect(() => {
    if (currentProfile) {
      setName(currentProfile.name || "");
      setBio(currentProfile.bio?.[0] || "");
      setEmail(currentProfile.contact_email?.[0] || "");
      setGithub(currentProfile.github_username?.[0] || "");
    }
  }, [currentProfile]);

  const handle = () => {
    if (!name) return toast.error("Name required");
    onSubmit({ profile_id: principalText, name, bio, contact_email: email, github_username: github });
  };

  return (
    <div className="profile-form panel">
      <h3>{currentProfile ? "Update Profile" : "Create Profile"}</h3>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
      <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" />
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input value={github} onChange={e => setGithub(e.target.value)} placeholder="GitHub" />
      <button onClick={handle}>{currentProfile ? "Update" : "Save"}</button>
    </div>
  );
}
