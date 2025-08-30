// //this is my UserProfileForm component

// import { toBase64 } from "../utils/base64"; // or define it locally
// import React, { useState, useEffect } from "react";
// import { toast } from "react-hot-toast";

// export default function UserProfileForm({ principalText, currentProfile, onSubmit, avatarPreview, onImageChange}) {
//   const [name, setName] = useState("");
//   const [bio, setBio] = useState("");
//   const [email, setEmail] = useState("");
//   const [github, setGithub] = useState("");

//   useEffect(() => {
//     if (currentProfile) {
//       setName(currentProfile.name || "");
//       setBio(currentProfile.bio?.[0] || "");
//       setEmail(currentProfile.contact_email?.[0] || "");
//       setGithub(currentProfile.github_username?.[0] || "");
//     }
//   }, [currentProfile]);

//   const handle = () => {
//     if (!name) return toast.error("Name required");
//     onSubmit({ profile_id: principalText, name, bio, contact_email: email, github_username: github });
//   };

//   return (
//     <div className="profile-form panel">
//       <h3>{currentProfile ? "Update Profile" : "Create Profile"}</h3>
//         {/* <input
//             type="file"
//             accept="image/*"
//             onChange={async (e) =>
//                {
//                 const file = e.target.files[0];
//                   if (file) {
//                               const base64 = await toBase64(file);
//                               const mime = file.type;
//                               onImageChange(base64, mime); // ✅ not handleFileChange
//                             }
//               }
//               }
// /> */}

// <label className="upload-label">
//   Upload Profile Image
//   <input
//     type="file"
//     accept="image/*"
//     onChange={async (e) => {
//       const file = e.target.files[0];
//       if (!file) return;

//       if (!file.type.startsWith("image/")) {
//         toast.error("Only image files are allowed");
//         return;
//       }
//       if (file.size > 500000) {
//         toast.error("Image too large. Please upload a smaller file.");
//         return;
//       }

//       const base64 = await toBase64(file);
//       const mime = file.type;
//       onImageChange(base64, mime);
//     }}
//   />
// </label>
//       <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
//       <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" />
//       <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
//       <input value={github} onChange={e => setGithub(e.target.value)} placeholder="GitHub" />
//       <button onClick={handle}>{currentProfile ? "Update" : "Save"}</button>
//     </div>
//   );
// }
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function UserProfileForm({
  principalText,
  currentProfile,
  onSubmit,
  avatarPreview,
  onImageChange
}) {
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

  //const byteArray = Uint8Array.from(atob(currentProfile.avatar), c => c.charCodeAt(0));
  // // 🖼️ Avatar URL logic with fallback
  // const getAvatarUrl = () => {
  //   if (avatarPreview) return avatarPreview; // live preview from upload
  //   if (currentProfile?.avatar && currentProfile?.avatar_mime) 
  //   {
  //             const byteArray = Array.isArray(currentProfile.avatar)
  //             ? currentProfile.avatar
  //             : Uint8Array.from(atob(currentProfile.avatar), c => c.charCodeAt(0));
  //           return `data:${currentProfile.avatar_mime};base64,${btoa(String.fromCharCode(...byteArray)  )}`;
  //   }
  //   return "/default-avatar.jpeg"; // fallback image
  // };
const getAvatarUrl = () =>
   {
      if (avatarPreview) return avatarPreview;
      console.log("Avatar preview after login:", avatarPreview);

       if (!currentProfile) return "/default-avatar.jpeg"; // ✅ early exit

      // const avatar = currentProfile?.avatar;
      // const mime = currentProfile?.avatar_mime;
      const avatar = currentProfile?.avatar?.[0];
      const mime = currentProfile?.avatar_mime?.[0];

      // if (avatar && mime) 
      //   {
      //       try {
      //         const byteArray = Array.isArray(avatar)
      //           ? avatar
      //           : Uint8Array.from(atob(avatar), c => c.charCodeAt(0));
      //         const base64 = btoa(String.fromCharCode(...byteArray));
      //         return `data:${mime};base64,${base64}`;
      //       } 
      //       catch (err) 
      //       {
      //         console.warn("Avatar decoding failed:", err);
      //         return "/default-avatar.jpeg";
      //        }
      // }
  if (avatar && mime) {
    try {
      const byteArray = new Uint8Array(avatar); // ensure it's a Uint8Array
      const CHUNK_SIZE = 0x8000;
      let binary = "";
      for (let i = 0; i < byteArray.length; i += CHUNK_SIZE) {
        const chunk = byteArray.subarray(i, i + CHUNK_SIZE);
        binary += String.fromCharCode(...chunk);
      }
      const base64 = btoa(binary);
      return `data:${mime};base64,${base64}`;
    } catch (err) {
      console.warn("Avatar decoding failed:", err);
      return "/default-avatar.jpeg";
    }
  }

      return "/default-avatar.jpeg";
  };
console.log("🖼️ Final avatar URL:", getAvatarUrl());

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    onSubmit({
      profile_id: principalText,
      name,
      bio,
      contact_email: email,
      github_username: github
    });
  };

const handleFileChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast.error("Only image files are allowed");
    return;
  }
  if (file.size > 500000) {
    toast.error("Image too large. Please upload a smaller file.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result; // full data URL
    const base64 = result.split(",")[1];
    onImageChange(base64, file.type); // ✅ triggers App.jsx logic
  };
  reader.readAsDataURL(file);
};
  return (
    <div className="profile-form panel">
      <h3>{currentProfile ? "Update Profile" : "Create Profile"}</h3>

     
        <img
          src={getAvatarUrl()}
          alt="Profile Preview"
          className="avatar-preview"
          style={{
            width: "100px",
            height: "100px",
            objectFit: "cover",
            borderRadius: "8px",
            marginBottom: "1rem"
          }}
        />
      

      <label className="upload-label">
        Upload Profile Image
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
      </label>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        aria-label="Name"
      />

      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Bio"
        aria-label="Bio"
      />

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        aria-label="Email"
      />

      <input
        value={github}
        onChange={(e) => setGithub(e.target.value)}
        placeholder="GitHub"
        aria-label="GitHub"
      />

      <button onClick={handleSubmit}>
        {currentProfile ? "Update" : "Save"}
      </button>
    </div>
  );
}
