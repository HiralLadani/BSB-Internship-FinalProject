// roles.rs

use candid::{CandidType, Principal, Deserialize};
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap, Storable, };
use std::{cell::RefCell, borrow::Cow};
 use ic_stable_structures::storable::Bound;

type Memory = VirtualMemory<DefaultMemoryImpl>;
#[derive(Clone, Debug, CandidType, Deserialize, PartialEq, Eq)]
pub enum Role {
    Admin,
    Student,
    Developer,
    Professor,
    Guest,
}
thread_local! {
    pub static MEM_MGR_ROLES: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    pub static USER_ROLES: RefCell<StableBTreeMap<Principal, Role, Memory>> =
        RefCell::new(StableBTreeMap::init(
            MEM_MGR_ROLES.with(|m| m.borrow().get(MemoryId::new(0)))
        ));
}

impl Storable for Role {
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

pub fn init_if_needed(deployer: Principal) {
    USER_ROLES.with(|r| {
        let mut map = r.borrow_mut();
        if map.len() == 0 {
            map.insert(deployer, Role::Developer);
        }
    });
}

// pub fn is_admin(p: Principal) -> bool {
//     USER_ROLES.with(|r| {
//         r.borrow().get(&p).map(|r| *r == Role::Admin).unwrap_or(false)
//     })
// }
pub fn is_admin(p: Principal) -> bool {
    USER_ROLES.with(|r| {
        r.borrow()
            .get(&p)
           .map(|role| role == Role::Admin)
            .unwrap_or(false)
    })
}
pub fn is_developer(p: Principal) -> bool {
    USER_ROLES.with(|r| {
        r.borrow()
            .get(&p)
           .map(|role| role == Role::Developer)
            .unwrap_or(false)
    })
}
pub fn is_professor(p: Principal) -> bool {
    USER_ROLES.with(|r| {
        r.borrow().get(&p).map(|role| role ==  Role::Professor).unwrap_or(false)
    })
}

pub fn is_student(p: Principal) -> bool {
    USER_ROLES.with(|r| {
        r.borrow().get(&p).map(|role| role == Role::Student).unwrap_or(false)
    })
}

// pub fn login_as_role(p: Principal, requested: Role) -> Role {
//     USER_ROLES.with(|r| {
//         let mut map = r.borrow_mut();
//         if let Some(existing) = map.get(&p) {
//             existing.clone()
//         } else {
//             let new_role = if requested == Role::Admin
//                 && map.values().any(|role| role == Role::Admin)
//             {
//                 Role::Guest
//             } else {
//                 requested.clone()
//             };
//             map.insert(p, new_role.clone()).unwrap();
//             new_role
//         }
//     })
// }
// pub fn login_as_role(p: Principal, requested: Role) -> Role {
//     USER_ROLES.with(|r| {
//         let mut map = r.borrow_mut();
//         match map.get(&p) {
//             Some(existing) => existing.clone(),
//             None => {
//                 let new_role = if requested == Role::Admin && map.values().any(|r| r == Role::Admin) {
//                     Role::Guest
//                 } else {
//                     requested.clone()
//                 };
//                 map.insert(p, new_role.clone()).unwrap(); // insert should be safe if map accepts it
//                 new_role
//             }
//         }
//     })
// }
pub fn login_as_role(p: Principal, requested: Role) -> Role {
    USER_ROLES.with(|r| {
        let mut map = r.borrow_mut();
        match map.get(&p) {
            Some(existing) => existing.clone(),
            None => {
                // First time user: always assign Guest, ignore requested unless Admin and none exists
                let new_role = if requested == Role::Admin && map.values().any(|r| r == Role::Admin) {
                    Role::Guest
                } else if requested == Role::Admin {
                    Role::Admin
                } else {
                    Role::Guest
                };
                map.insert(p, new_role.clone());
                new_role
            }
        }
    })
}

pub fn assign_role(user: Principal, role: Role) {
    let caller = ic_cdk::caller();
    assert!(is_admin(caller), "Authorization failed: only admins");
    USER_ROLES.with(|m| m.borrow_mut().insert(user, role.clone()));
   // USER_ROLES.with(|r| r.borrow_mut().insert(user, role));
    println!("Admin {:?} assigned role {:?} to user {:?}", caller, role, user);
}
pub fn assign_admin(user: Principal) {
     let me = ic_cdk::caller();
    assert!(is_admin(me) || is_developer(me), "Authorization failed: only admins or developers");
    USER_ROLES.with(|r| {
        r.borrow_mut().insert(user, Role::Admin);
    });
    ic_cdk::println!("Privileged {:?} assigned Admin to {:?}", me, user);
}
// pub fn assign_role(user: Principal, role: Role) {
//     USER_ROLES.with(|r| {
//         r.borrow_mut().insert(user, role).unwrap();
//     });
// }
// pub fn assign_admin_by_developer(user: Principal) {
//     let me = ic_cdk::caller();
//     assert!(is_admin(me) || is_developer(me), "Authorization failed: only admins or developers");
//     USER_ROLES.with(|r| {
//         r.borrow_mut().insert(user, Role::Admin);
//     });
//     ic_cdk::println!("Privileged {:?} assigned Admin to {:?}", me, user);
// }

pub fn list_users() -> Vec<(Principal, Role)> {
    USER_ROLES.with(|r| {
        let mut result = Vec::new();
        for entry in r.borrow().iter() {
            let user = entry.key();
            let role = entry.value();
            result.push((user.clone(), role.clone()));
        }
        result
    })
}
// pub fn list_principals() -> Vec<Principal> {
//     USER_ROLES.with(|r| r.borrow().iter().map(|(p, _)| *p).collect())
// }
pub fn list_principals() -> Vec<Principal> {
    USER_ROLES.with(|r| {
        let mut result = Vec::new();
        for entry in r.borrow().iter() {
            let user = entry.key().clone();
            result.push(user);
        }
        result
    })
}
pub fn my_role(p: Principal) -> Role {
    USER_ROLES.with(|r| {
        r.borrow()
         .get(&p)
         .unwrap_or(Role::Guest)
    })
}

