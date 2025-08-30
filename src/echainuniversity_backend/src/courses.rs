// courses.rs

use candid::{CandidType, Principal, Deserialize};
use std::collections::HashMap;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap, Storable,};
 use ic_stable_structures::storable::Bound;
use std::{cell::RefCell, borrow::Cow};
type CourseId = String;
type UserId = Principal;
type Memory = VirtualMemory<DefaultMemoryImpl>;
// Represents a course in the university
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Course {
    pub id: CourseId,
    pub title: String,
    pub description: String,
    pub professor_id: UserId, // Principal of the professor who created it
    pub status: CourseStatus,
    pub created_at: u64,
    pub vote_count: u64, // Number of student votes (for future voting feature)
    pub voters: HashMap<UserId, bool>, // Tracks which students have voted (for future voting feature)
    pub enrolled_students: HashMap<UserId, bool>, // Tracks enrolled students (for future enrollment)
}

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq, Eq)]
pub enum CourseStatus {
    Draft,    // Created by Professor, not yet proposed
    Proposed, // Proposed by Professor, awaiting student votes
    Voting,   // Actively in voting phase (could be a sub-status of Proposed)
    Approved, // Approved by Admin, open for enrollment
    Rejected, // Rejected by Admin or failed voting
    Archived, // Old courses
    Suggest,// student suggestion
}

thread_local! {
    /// Unique slot for courses
    static MEM_MGR_COURSES: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    /// Stable storage of courses: CourseId → Course
    static COURSES_STORE: RefCell<StableBTreeMap<String, Course, Memory>> =
        RefCell::new(
            StableBTreeMap::init(
                MEM_MGR_COURSES.with(|m| m.borrow().get(MemoryId::new(2)))
            )
        );
}

impl Storable for Course {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        candid::decode_one(&bytes[..]).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        self.to_bytes().into_owned()
    }

    const BOUND: Bound = Bound::Unbounded;
}
/// Called (e.g. in init) to bootstrap if necessary
pub fn init_if_needed(_deployer: Principal) {
    // nothing to init
}

pub fn create_course(course_id: String, course: Course) -> Result<Course, String> {
    COURSES_STORE.with(|store| {
        let mut map = store.borrow_mut();
        if map.contains_key(&course_id) {
            Err("Course ID collision, please try again.".to_string())
        } else {
            map.insert(course_id.clone(), course.clone());
            Ok(course)
        }
    })
}
pub fn suggest_course(course_id: String, course: Course) -> Result<Course, String> {
        // Ensure status is set to Suggest
   
    COURSES_STORE.with(|store| {
        let mut map = store.borrow_mut();
        if map.contains_key(&course_id) {
            Err("Course ID collision, please try again.".to_string())
        } else {
            map.insert(course_id.clone(), course.clone());
            Ok(course)
        }
    })
}


pub fn propose_course(course_id: String, caller: Principal) -> Result<Course, String> {
    modify(course_id, |c| {
        if c.professor_id != caller {
            return Err("Only the professor who created this course can propose it.".to_string());
        }
        if c.status != CourseStatus::Draft {
            return Err(format!("Course is not in Draft status. Current status: {:?}", c.status));
        }
        c.status = CourseStatus::Proposed;
        Ok(())
    })
}


pub fn vote_for_suggest_course(course_id: String, caller: Principal) -> Result<Course, String> {
    modify(course_id, |c| {
        // Only allow voting if the course is in the "Suggest" status
        if c.status != CourseStatus::Suggest {
            return Err(format!("Course is not open for suggestion voting. Current status: {:?}", c.status));
        }
        if c.voters.contains_key(&caller) {
            return Err("You have already voted for this suggested course.".to_string());
        }
        // Count the vote and mark the voter
        c.vote_count += 1;
        c.voters.insert(caller, true);
        // Optionally: change status if enough votes are reached
        Ok(())
    })
}
pub fn vote_for_course(course_id: String, caller: Principal) -> Result<Course, String> {
    modify(course_id, |c| {
        if c.status != CourseStatus::Proposed && c.status != CourseStatus::Voting {
            return Err(format!("Course is not open for voting. Current status: {:?}", c.status));
        }
        if c.voters.contains_key(&caller) {
            return Err("You have already voted for this course.".to_string());
        }
        c.vote_count += 1;
        c.voters.insert(caller, true);
        if c.status == CourseStatus::Proposed {
            c.status = CourseStatus::Voting;
        }
        Ok(())
    })
}

pub fn approve_course(course_id: String) -> Result<Course, String> {
    modify(course_id, |c| {
        if c.status != CourseStatus::Proposed && c.status != CourseStatus::Voting {
            return Err(format!("Course cannot be approved from current status: {:?}", c.status));
        }
        c.status = CourseStatus::Approved;
        Ok(())
    })
}

pub fn reject_course(course_id: String) -> Result<Course, String> {
    modify(course_id, |c| {
        if c.status == CourseStatus::Approved {
            return Err("Approved courses cannot be directly rejected. Consider archiving.".to_string());
        }
        c.status = CourseStatus::Rejected;
        Ok(())
    })
}

pub fn enroll_in_course(course_id: String, caller: Principal) -> Result<Course, String> {
    modify(course_id, |c| {
        if c.status != CourseStatus::Approved {
            return Err("Course is not approved for enrollment.".to_string());
        }
        if c.enrolled_students.contains_key(&caller) {
            return Err("You are already enrolled in this course.".to_string());
        }
        c.enrolled_students.insert(caller, true);
        Ok(())
    })
}

pub fn get_my_enrolled_courses(_caller: Principal) -> Vec<Course> {
    // Enrollment tracking left in heap or separate module
    // If you track in stable memory, implement a stable map for STUDENT_ENROLLMENTS
    Vec::new()
}

pub fn get_course_details(course_id: String) -> Option<Course> {
    COURSES_STORE.with(|store| store.borrow().get(&course_id))
}

pub fn list_courses(filter_status: Option<CourseStatus>) -> Vec<Course> {
    COURSES_STORE.with(|store| {
        let map_ref = store.borrow();
        let mut result = Vec::new();
        for entry in map_ref.iter() {
            let course = entry.value();
             if filter_status.clone().map_or(true, |st| course.status == st) {
                result.push(course.clone());
            }
        }
        result
    })
}
/// Internal helper to modify a course in place and return updated clone
fn modify<F>(course_id: String, f: F) -> Result<Course, String>
where
    F: FnOnce(&mut Course) -> Result<(), String>,
{
    COURSES_STORE.with(|store| {
        let mut map = store.borrow_mut();
        if let Some(mut c) = map.get(&course_id) {
            f(&mut c)?;
            map.insert(course_id.clone(), c.clone()).unwrap();
            Ok(c)
        } else {
            Err("Course not found.".to_string())
        }
    })
}
