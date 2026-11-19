CREATE DATABASE IF NOT EXISTS student_os CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_os;

CREATE TABLE users (
  id VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY users_email_key (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subjects (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  color VARCHAR(32) NOT NULL DEFAULT '#3B82F6',
  drive_url TEXT NULL,
  notes TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY subjects_user_id_sort_order_idx (user_id, sort_order),
  CONSTRAINT subjects_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chapters (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  subject_id VARCHAR(191) NOT NULL,
  number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  mastery_level ENUM('NOT_STARTED', 'COURSE_SEEN', 'TD_IN_PROGRESS', 'MASTERED') NOT NULL DEFAULT 'NOT_STARTED',
  is_priority BOOLEAN NOT NULL DEFAULT FALSE,
  course_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  summary_done BOOLEAN NOT NULL DEFAULT FALSE,
  exercises_done BOOLEAN NOT NULL DEFAULT FALSE,
  past_exams_done BOOLEAN NOT NULL DEFAULT FALSE,
  obsidian_url TEXT NULL,
  drive_url TEXT NULL,
  extra_url TEXT NULL,
  quick_notes TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY chapters_user_id_subject_id_number_idx (user_id, subject_id, number),
  CONSTRAINT chapters_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chapters_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assignments (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  subject_id VARCHAR(191) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type ENUM('DS', 'TP', 'DM', 'PROJET', 'KHOLLE', 'REVISION') NOT NULL DEFAULT 'DS',
  due_date DATETIME(3) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY assignments_user_id_due_date_idx (user_id, due_date),
  KEY assignments_subject_id_idx (subject_id),
  CONSTRAINT assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT assignments_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subject_resources (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  subject_id VARCHAR(191) NOT NULL,
  label VARCHAR(191) NOT NULL,
  url TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Général',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY subject_resources_subject_id_idx (subject_id),
  CONSTRAINT subject_resources_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT subject_resources_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;