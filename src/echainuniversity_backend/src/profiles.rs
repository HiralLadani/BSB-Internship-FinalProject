// profiles.rs
use candid::{CandidType, Principal, Deserialize};
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap, Storable,};
 use std::{cell::RefCell, borrow::Cow};
 use ic_stable_structures::storable::Bound;



type Memory = VirtualMemory<DefaultMemoryImpl>;
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct UserProfile {
  pub profile_id: Principal,
  pub name: String,
  pub bio: Option<String>,
  pub contact_email: Option<String>,
  pub github_username: Option<String>,   
// pub profile_image: Option<Vec<u8>>,
// pub profile_image_mime: Option<String>,    
    pub avatar: Option<Vec<u8>>,
    pub avatar_mime: Option<String>,

}

thread_local! {
    pub static MEM_MGR_PROFILES: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    pub static USER_PROFILES: RefCell<StableBTreeMap<Principal, UserProfile, Memory>> =
        RefCell::new(StableBTreeMap::init(
            MEM_MGR_PROFILES.with(|m| m.borrow().get(MemoryId::new(1)))
        ));
}

impl Storable for UserProfile {
    fn to_bytes(&self) -> Cow<[u8]> {
        let bytes = candid::encode_one(self).unwrap();
        Cow::Owned(bytes)
    }

    fn into_bytes(self) -> Vec<u8> {
        // You can reuse to_bytes and convert to Vec
        match self.to_bytes() {
            Cow::Owned(vec) => vec,
            Cow::Borrowed(b) => b.to_vec(),
        }
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes[..]).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

pub fn init_if_needed(_deployer: Principal) {
    // no bootstrap needed
}

// pub fn create_or_update_my_profile(user: Principal, profile: UserProfile) {
//     USER_PROFILES.with(|m| {
//         let mut map = m.borrow_mut();
//         map.insert(user, profile);
//     });
// }
pub fn create_or_update_my_profile(user: Principal, profile: UserProfile) {
    let has_image = profile.avatar.is_some();
    let mime = profile.avatar_mime.clone().unwrap_or("none".to_string());
  // ✅ Insert here — after receiving the profile, before storing
    if let Some(ref avatar) = profile.avatar {
        let size = avatar.len();
        ic_cdk::println!("Image size for {}: {} bytes", user, size);
    }
if let Some(ref mime) = profile.avatar_mime {
    ic_cdk::println!("Image MIME type: {}", mime);
}

    ic_cdk::println!(
        "Updating profile for {:?}: image present = {}, mime = {}",
        user,
        has_image,
        mime
    );

    USER_PROFILES.with(|m| {
        let mut map = m.borrow_mut();
        map.insert(user, profile);
    });
}
pub fn has_profile_image(user: Principal) -> bool {
    
    USER_PROFILES.with(|profiles| {
        profiles
            .borrow()
            .get(&user)
            .map(|profile| profile.avatar.is_some())
            .unwrap_or(false)
    })
}
pub fn get_profile_image_info(user: Principal) -> Option<(usize, String)> {
    USER_PROFILES.with(|profiles| {
        profiles.borrow().get(&user).and_then(|profile| {
            profile.avatar.as_ref().map(|bytes| {
                let size = bytes.len();
                let mime = profile.avatar_mime.clone().unwrap_or("unknown".to_string());
                (size, mime)
            })
        })
    })
}



pub fn get_my_profile(user: Principal) -> Option<UserProfile> {
    USER_PROFILES.with(|m| {
        m.borrow()
         .get(&user)           // returns Option<&UserProfile>
         .map(|v| v.clone())   // converts to Option<UserProfile>
    })
}
pub fn list_user_profiles() -> Vec<(Principal, UserProfile)> {
    USER_PROFILES.with(|m| {
        let mut result = Vec::new();
        for entry in m.borrow().iter() {
            let p = entry.key().clone();
            let prof = entry.value();
            result.push((p, prof));
        }
        result
    })
}
//  pub fn upload_my_profile_image(image: Vec<u8>, mime: String) {
//     let caller = ic_cdk::caller();
//     if let Some(profile) = USER_PROFILES.get_mut(&caller) {
//         profile.avatar = Some(image);
//         profile.avatar_mime = Some(mime);
//     }
// }

// pub fn upload_my_profile_image(image: Vec<u8>, mime: String) {
//     let caller = ic_cdk::caller();
//     USER_PROFILES.with(|profiles| {
//         let mut map = profiles.borrow_mut();
//         if let Some(mut profile) = map.get(&caller) {
//             profile.profile_image = Some(image);
//             profile.profile_image_mime = Some(mime);
//             map.insert(caller, profile); // overwrite with updated profile
//         }
//     });
// }
// pub fn upload_my_profile_image(image: Vec<u8>, mime: String) {
//     let allowed_mimes = ["image/png", "image/jpeg", "image/webp"];
//     if !allowed_mimes.contains(&mime.as_str()) {
//         ic_cdk::trap("Unsupported image format");
//     }

//     let caller = ic_cdk::caller();
//     USER_PROFILES.with(|profiles| {
//         let mut map = profiles.borrow_mut();
//         if let Some(mut profile) = map.get(&caller) {
//             profile.profile_image = Some(image);
//             profile.profile_image_mime = Some(mime);
//             map.insert(caller, profile); // overwrite with updated profile
//         }
//     });
// }

// pub fn get_my_profile_image() -> Option<(Vec<u8>, String)> {
//     let caller = ic_cdk::caller();
//     USER_PROFILES.with(|profiles| {
//         profiles.borrow().get(&caller).and_then(|profile| {
//             profile.profile_image.clone().map(|img| {
//                 let mime = profile.profile_image_mime.clone().unwrap_or_else(|| "image/png".to_string());
//                 (img, mime)
//             })
//         })
//     })
// }

// pub fn get_profile_image(profile_id: Principal) -> Option<(Vec<u8>, String)> {
//     let profile = get_my_profile(profile_id)?;
//     match (profile.profile_image, profile.profile_image_mime) {
//         (Some(bytes), Some(mime)) => Some((bytes, mime)),
//         _ => None,
//     }
// }

// pub fn get_my_profile_image() -> Option<(Vec<u8>, String)> {
//     let caller = ic_cdk::caller();
//     USER_PROFILES.with(|profiles| {
//         profiles.borrow().get(&caller).and_then(|profile| {
//             match (&profile.profile_image, &profile.avatar_mime) {
//                 (Some(data), Some(mime)) => Some((data.clone(), mime.clone())),
//                 _ => None,
//             }
//         })
//     })
// }