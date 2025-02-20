CREATE DATABASE  IF NOT EXISTS `talleres_unidos` 
USE `talleres_unidos`;


DROP TABLE IF EXISTS `solicitudes`;

CREATE TABLE `solicitudes` (
  `id` varchar(36) NOT NULL,
  `vin` varchar(255) DEFAULT NULL,
  `pieza` varchar(100) NOT NULL,
  `taller` varchar(100) NOT NULL,
  `fecha` datetime NOT NULL,
  `localizacion` json DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `estado` enum('Pendiente','Instalada') NOT NULL,
  `mecanico` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `solicitudes_respondidas`;

CREATE TABLE `solicitudes_respondidas` (
  `id` varchar(36) NOT NULL,
  `taller` varchar(100) NOT NULL,
  `fechaEnvio` datetime NOT NULL,
  `localizacion` json DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `estatus` enum('Instalada','Pendiente','Enviada') NOT NULL,
  `solicitudOriginalId` varchar(36) DEFAULT NULL,
  `mecanico` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `solicitudes_respondidas_ibfk_1` (`solicitudOriginalId`),
  CONSTRAINT `solicitudes_respondidas_ibfk_1` FOREIGN KEY (`solicitudOriginalId`) REFERENCES `solicitudes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

