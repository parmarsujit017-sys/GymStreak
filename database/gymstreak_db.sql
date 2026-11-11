-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Nov 07, 2026 at 01:47 PM
-- Server version: 5.7.40
-- PHP Version: 8.0.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gymstreak_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
CREATE TABLE IF NOT EXISTS `admin` (
  `admin_id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`admin_id`, `full_name`, `email`, `password`, `created_at`) VALUES
(1, 'Gym Admin', 'admin@gmail.com', '$2b$10$tTxc/c9kzlAPgeMH648miuEWwhuAQ4a6Ctz5vOo1gzNbQBFAr2veu', '2026-11-06 07:34:27');

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
CREATE TABLE IF NOT EXISTS `attendance` (
  `attendance_id` int(11) NOT NULL AUTO_INCREMENT,
  `member_id` int(11) NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('Present','Absent','Late') NOT NULL DEFAULT 'Present',
  `check_in` time DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `unique_member_date` (`member_id`,`attendance_date`),
  KEY `idx_attendance_member` (`member_id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`attendance_id`, `member_id`, `attendance_date`, `status`, `check_in`, `created_at`) VALUES
(1, 1, '2026-11-05', 'Present', '12:00:00', '2026-11-05 10:54:36'),
(2, 2, '2026-11-05', 'Absent', NULL, '2026-11-05 10:57:02'),
(3, 3, '2026-11-07', 'Absent', NULL, '2026-11-07 07:14:29');

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

DROP TABLE IF EXISTS `members`;
CREATE TABLE IF NOT EXISTS `members` (
  `member_id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `join_date` date NOT NULL,
  `membership_plan` varchar(30) NOT NULL,
  `status` varchar(20) DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`member_id`, `full_name`, `email`, `phone`, `gender`, `date_of_birth`, `join_date`, `membership_plan`, `status`, `created_at`) VALUES
(1, 'Sujit Parmar', 'sujitparmar957@gmail.com', '06352651779', 'Male', '2007-03-18', '2026-11-04', 'Standard', 'Active', '2026-11-04 15:12:13'),
(2, 'sujit parmar', 'parmarsujit017@gmail.com', '85487587', 'Male', '2025-05-07', '2026-02-06', 'Standard', 'Active', '2026-11-05 08:14:55'),
(3, 'vandit', 'vandit@gmail.com', '454852588', 'Male', '2008-05-15', '2026-11-07', 'demo', 'Active', '2026-11-07 05:39:01');

-- --------------------------------------------------------

--
-- Table structure for table `memberships`
--

DROP TABLE IF EXISTS `memberships`;
CREATE TABLE IF NOT EXISTS `memberships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `member_id` int(11) NOT NULL,
  `plan_name` varchar(100) NOT NULL,
  `duration` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_status` enum('Paid','Pending','Failed') DEFAULT 'Pending',
  `status` enum('Active','Expired','Cancelled') DEFAULT 'Active',
  `payment_method` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_membership_member` (`member_id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `memberships`
--

INSERT INTO `memberships` (`id`, `member_id`, `plan_name`, `duration`, `start_date`, `end_date`, `amount`, `payment_status`, `status`, `payment_method`, `created_at`, `updated_at`) VALUES
(1, 1, 'Quarterly', 20, '2026-11-02', '2026-11-22', '65000.00', 'Paid', 'Active', 'Card', '2026-11-05 10:10:05', '2026-11-05 10:11:03'),
(2, 2, 'Yearly', 365, '2026-11-04', '2026-12-04', '78000.00', 'Paid', 'Active', 'UPI', '2026-11-05 10:13:42', '2026-11-05 10:16:01'),
(3, 3, 'demo', 10, '2026-11-07', '2026-11-17', '200.00', 'Paid', 'Active', 'Razorpay', '2026-11-07 07:11:07', '2026-11-07 07:11:07');

-- --------------------------------------------------------

--
-- Table structure for table `membership_plans`
--

DROP TABLE IF EXISTS `membership_plans`;
CREATE TABLE IF NOT EXISTS `membership_plans` (
  `plan_id` int(11) NOT NULL AUTO_INCREMENT,
  `plan_name` varchar(100) NOT NULL,
  `duration` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`plan_id`),
  UNIQUE KEY `plan_name` (`plan_name`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `membership_plans`
--

INSERT INTO `membership_plans` (`plan_id`, `plan_name`, `duration`, `amount`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'sujit parmar', 20, '25000.00', 'xyz', 'Active', '2026-11-07 04:50:18', '2026-11-07 04:50:18'),
(2, 'demo', 10, '200.00', 'abc', 'Active', '2026-11-07 04:54:40', '2026-11-07 04:54:40');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `member_id` int(11) NOT NULL,
  `membership_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_method` enum('Cash','UPI','Card','Bank Transfer','Razorpay') NOT NULL,
  `payment_status` enum('Paid','Pending','Failed') DEFAULT 'Paid',
  `transaction_id` varchar(100) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `membership_id` (`membership_id`),
  KEY `idx_payments_member` (`member_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `member_id`, `membership_id`, `amount`, `payment_date`, `payment_method`, `payment_status`, `transaction_id`, `notes`, `created_at`) VALUES
(1, 1, 1, '65000.00', '2026-11-05', 'UPI', 'Paid', '123456789', 'xyz', '2026-11-05 15:19:29'),
(2, 3, 3, '200.00', '2026-11-07', 'Razorpay', 'Paid', 'pay_TxCLLc7YJXQDbq', 'Razorpay order: order_TxCL1doBiqYpbz', '2026-11-07 07:11:08');

-- --------------------------------------------------------

--
-- Table structure for table `trainers`
--

DROP TABLE IF EXISTS `trainers`;
CREATE TABLE IF NOT EXISTS `trainers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trainer_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `experience` int(11) DEFAULT '0',
  `salary` decimal(10,2) DEFAULT '0.00',
  `joining_date` date DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `photo` longtext,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `trainers`
--

INSERT INTO `trainers` (`id`, `trainer_name`, `email`, `phone`, `gender`, `specialization`, `experience`, `salary`, `joining_date`, `status`, `photo`, `created_at`, `updated_at`) VALUES
(1, 'vandit', 'vandit447@gmail.com', '+91 98765 43210', 'Male', 'yoga', 1, '25000.00', '2005-05-15', 'Active', NULL, '2026-11-05 09:38:02', '2026-11-05 09:38:02');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `member_id` int(11) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `member_id` (`member_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `member_id`, `full_name`, `email`, `password`, `created_at`) VALUES
(1, NULL, 'Test User', 'test@gmail.com', '$2b$10$OCgTbnOK9gRa9miTPdcPJ.keycnaWrXwrZxP1gKHb7xlSACyCbZkO', '2026-11-05 15:32:45'),
(2, 1, 'Sujit Parmar', 'sujitparmar957@gmail.com', 'PASTE_GENERATED_HASH_HERE', '2026-11-06 06:46:30'),
(3, 2, 'sujit parmar', 'parmarsujit017@gmail.com', '$2b$10$NKVTEA9C/jM29bsUnbTHae7OlFKsjsBdms1sKOUiHKY2QBzi2qUVy', '2026-11-06 08:49:46'),
(4, 3, 'vandit', 'vandit@gmail.com', '$2b$10$w0S0bMVqWKQ3KihP53xXA.RvQDVXPl0J25HyctU1yrHLecG8i31Sq', '2026-11-07 05:15:14');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
