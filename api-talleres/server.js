const moment = require('moment');
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer'); 
const path = require('path');
const fs = require('fs'); 

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'talleres_unidos'
});

// Conexión a la base de datos
db.connect(err => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('Conectado a MySQL');
});

// Crear la carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Carpeta uploads creada');
}

// Configuración de multer para manejar archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir)); 
const upload = multer({ storage });
// Ruta para crear una solicitud
app.post('/solicitudes', upload.single('foto'), (req, res) => {
    const { vin, pieza, taller, fecha, localizacion, estado } = req.body;
    const id = uuidv4();
    const foto = req.file ? `/uploads/${req.file.filename}` : null;  // Guarda la foto en el servidor

    const fechaFormateada = moment(fecha).format('YYYY-MM-DD HH:mm:ss');
    console.log(req.body)

    db.query(
        "INSERT INTO solicitudes (id, vin, pieza, taller, fecha, localizacion, foto, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, vin, pieza, taller, fechaFormateada, JSON.stringify(localizacion), foto, estado],
        (err, result) => {
            if (err) {
                console.error('Error al crear solicitud:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            res.status(201).json({ message: 'Solicitud creada con éxito', id });
        }
    );
});


// Ruta para obtener todas las solicitudes
app.get('/solicitudes', (req, res) => {
    db.query("SELECT * FROM solicitudes", (err, results) => {
        if (err) {
            console.error('Error al obtener solicitudes:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json(results);
    });
});

// Ruta para actualizar el estado de una solicitud
app.put('/solicitudes/:id', (req, res) => {
    const { estado } = req.body;
    const { id } = req.params;

    console.log("ID recibido:", id);
    console.log("Estado recibido:", estado);

    db.query(
        "UPDATE solicitudes_respondidas SET estatus = ? WHERE id = ?",
        [estado, id],
        (err, result) => {
            if (err) {
                console.error('Error al actualizar solicitud:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            console.log("Filas afectadas:", result.affectedRows);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Solicitud no encontrada' });
            }
            res.json({ message: 'Solicitud actualizada' });
        }
    );
});


// Ruta para obtener solicitudes pendientes
app.get('/solicitudes/pendientes', (req, res) => {
    db.query("SELECT * FROM solicitudes WHERE estado = 'Pendiente'", (err, results) => {
        if (err) {
            console.error('Error al obtener solicitudes pendientes:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json(results);
    });
});

// Ruta para obtener solicitudes atendidas
app.get('/solicitudes/atendidas', (req, res) => {
    const dbQuery = 
        `SELECT 
    sr.localizacion AS localizacion,
    sr.fechaEnvio AS fecha,
    sr.taller AS taller,
    sr.mecanico AS mecanico,
    sr.solicitudOriginalId AS solicitudOriginalId,
    sr.estatus AS estatus,
    sr.id AS solicitudRespondidaId,
    COALESCE(s.vin, 'VIN no necesario') AS vin,
    s.pieza AS pieza
FROM solicitudes_respondidas sr
JOIN solicitudes s ON sr.solicitudOriginalId = s.id
WHERE sr.estatus = 'Enviada' AND s.estado = 'Instalada';
`
        ;
  
    db.query(dbQuery, (err, results) => {
      if (err) {
        console.error('Error al obtener solicitudes atendidas:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      console.log('Resultados de la consulta:', results);
      res.json(results);
    });
  });
  

// Ruta para insertar una solicitud respondida
app.post('/inserta_solicitud_respondida', upload.single('foto'), (req, res) => {
    const { mecanico, taller, fechaEnvio, latitud, longitud, solicitudOriginalId } = req.body;
    const foto = req.file ? req.file.path : null;

    const fechaFormateada = moment(fechaEnvio).format('YYYY-MM-DD HH:mm:ss');

    const localizacion = JSON.stringify({
        latitude: latitud,
        longitude: longitud
    });

    const checkQuery = 'SELECT id FROM solicitudes WHERE id = ?';

    db.query(checkQuery, [solicitudOriginalId], (error, result) => {
        if (error) {
            console.error("Error al verificar solicitud original:", error);
            return res.status(500).json({ success: false, message: "Error en la base de datos" });
        }

        if (result.length === 0) {
            return res.status(400).json({ success: false, message: "Solicitud original no existe" });
        }
        
        const insertQuery = `
            INSERT INTO solicitudes_respondidas 
                (id, mecanico, taller, fechaEnvio, localizacion, foto, estatus, solicitudOriginalId)
            VALUES (UUID(), ?, ?, ?, ?, ?, 'Enviada', ?)
        `;

        db.query(insertQuery, [
            mecanico,
            taller,
            fechaFormateada,
            localizacion,
            foto,
            solicitudOriginalId
        ], (error, result) => {
            if (error) {
                console.error("Error al insertar:", error);
                return res.status(500).json({ success: false, message: "Error en la base de datos" });
            }

            // Actualizar el estado de la solicitud original
            const updateQuery = 'UPDATE solicitudes SET estado = ? WHERE id = ?';

            db.query(updateQuery, ['Instalada', solicitudOriginalId], (updateError, updateResult) => {
                if (updateError) {
                    console.error("Error al actualizar la solicitud:", updateError);
                    return res.status(500).json({ success: false, message: "Error al actualizar la solicitud" });
                }

                res.json({
                    success: true,
                    message: "Respuesta registrada y estado de solicitud actualizado a 'Instalada'",
                    id: result.insertId
                });
            });
        });
    });
});



// Ruta para eliminar una solicitud
app.delete('/solicitudes/:id', (req, res) => {
    const { id } = req.params;
  
    db.query("DELETE FROM solicitudes_respondidas WHERE solicitudOriginalId = ?", [id], (err, result) => {
      if (err) {
        console.error('Error al eliminar solicitud de solicitudes_respondidas:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
  
      db.query("DELETE FROM solicitudes WHERE id = ?", [id], (err, result) => {
        if (err) {
          console.error('Error al eliminar solicitud de solicitudes:', err);
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json({ message: 'Solicitud eliminada correctamente' });
      });
    });
  });
  

// Ruta para obtener una solicitud por ID
app.get("/solicitud/:id", (req, res) => {
    const { id } = req.params;
    const query = "SELECT id, vin, pieza, taller, fecha, localizacion, foto, estado FROM solicitudes WHERE id = ?";

    db.query(query, [id], (error, results) => {
        if (error) {
            console.error("Error al obtener la solicitud:", error);
            return res.status(500).json({ error: "Error en el servidor" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Solicitud no encontrada" });
        }

        let solicitud = results[0];

        if (solicitud.localizacion && typeof solicitud.localizacion === "string") {
            try {
                solicitud.localizacion = JSON.parse(solicitud.localizacion);
            } catch (err) {
                console.error("Error al parsear localización:", err);
                solicitud.localizacion = null; 
            }
        }

        res.json(solicitud);
    });
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(` Servidor corriendo en http://0.0.0.0:${PORT}`);
});