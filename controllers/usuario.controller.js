const Usuario = require('../models/usuario.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Cargar variables de entorno

const UsuarioController = {
  // Registrar un usuario
  async registrarse(req, res) {
    try {
      let { nombre, apellidos, nacionalidad, email, password, telefono } = req.body;
      const rol = 'jugador'; // Forzar siempre el rol a jugador en el registro público

      // Manejar el avatar si se subió un archivo
      let avatarUrl = null;
      if (req.file) {
        avatarUrl = req.file.path; // Cloudinary URL
      }

      // Verificar si el email ya está en uso
      const usuarioExistente = await Usuario.findOne({ email });
      if (usuarioExistente) {
        return res.status(400).json({ error: 'El correo ya está registrado' });
      }

      // Hashear la contraseña
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Crear usuario
      const nuevoUsuario = new Usuario({ 
        nombre, 
        apellidos,
        nacionalidad,
        email, 
        password: passwordHash, 
        rol, 
        telefono,
        avatar: avatarUrl 
      });
      const usuarioGuardado = await nuevoUsuario.save();

      // Generar token para auto-login
      const token = jwt.sign(
        { id: usuarioGuardado._id, rol: usuarioGuardado.rol },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(201).json({ 
        mensaje: 'Usuario registrado con éxito', 
        usuario: usuarioGuardado,
        token 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Iniciar sesión
  async loguearse(req, res) {
    try {
      const { email, password } = req.body;

      // Buscar usuario
      const usuario = await Usuario.findOne({ email });
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar contraseña
      const esValida = await bcrypt.compare(password, usuario.password);
      if (!esValida) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      // Crear token JWT
      const token = jwt.sign(
        { id: usuario._id, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({ mensaje: 'Inicio de sesión exitoso', token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Middleware para verificar token y rol
  verificarToken(req, res, next) {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'Acceso denegado, token requerido' });
    }

    // Extraer token si viene con "Bearer "
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    if (!token) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    try {
      const verificado = jwt.verify(token, process.env.JWT_SECRET);
      req.usuario = verificado;
      next();
    } catch (error) {
      res.status(403).json({ error: 'Token no válido o expirado' });
    }
  },

  // Middleware para verificar si el usuario es administrador o superadmin
  verificarAdministrador(req, res, next) {
    if (req.usuario.rol !== 'administrador' && req.usuario.rol !== 'superadmin') {
      return res.status(403).json({ error: 'Acceso restringido a administradores' });
    }
    next();
  },

  // Middleware para verificar si el usuario es superadmin
  verificarSuperAdmin(req, res, next) {
    if (req.usuario.rol !== 'superadmin') {
      return res.status(403).json({ error: 'Acceso restringido a super administradores' });
    }
    next();
  },

  // Obtener todos los usuarios (solo dueños pueden acceder)
  async obtenerUsuarios(req, res) {
    try {
      const usuarios = await Usuario.find().select('-password');
      res.status(200).json(usuarios);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener usuario por ID
  async obtenerUsuarioPorId(req, res) {
    try {
      const { id } = req.params;
      const usuario = await Usuario.findById(id).select('-password'); // Excluir contraseña por seguridad

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.status(200).json(usuario);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar el rol de un usuario (solo para superadmin)
  async actualizarRolUsuario(req, res) {
    try {
      const { id } = req.params;
      const { rol } = req.body;

      if (!['jugador', 'administrador', 'superadmin'].includes(rol)) {
        return res.status(400).json({ error: 'Rol no válido' });
      }

      const usuarioActualizado = await Usuario.findByIdAndUpdate(
        id,
        { rol },
        { new: true }
      ).select('-password');

      if (!usuarioActualizado) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.status(200).json({ mensaje: 'Rol actualizado con éxito', usuario: usuarioActualizado });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar datos del usuario
  async actualizarUsuario(req, res) {
    try {
      const { id } = req.params;
      const { nombre, apellidos, nacionalidad, telefono } = req.body;

      // Verificar que el usuario que intenta actualizar es el dueño de la cuenta o un admin
      if (req.usuario.id !== id && req.usuario.rol !== 'superadmin' && req.usuario.rol !== 'administrador') {
        return res.status(403).json({ error: 'No tienes permiso para actualizar este perfil' });
      }

      const actualizacion = {};
      if (nombre) actualizacion.nombre = nombre;
      if (apellidos) actualizacion.apellidos = apellidos;
      if (nacionalidad) actualizacion.nacionalidad = nacionalidad;
      if (telefono) actualizacion.telefono = telefono;

      // Manejar el avatar si se subió un archivo
      if (req.file) {
        actualizacion.avatar = req.file.path; // Cloudinary URL
      }

      const usuarioActualizado = await Usuario.findByIdAndUpdate(
        id,
        actualizacion,
        { new: true }
      ).select('-password');

      if (!usuarioActualizado) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.status(200).json({ mensaje: 'Usuario actualizado con éxito', usuario: usuarioActualizado });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = UsuarioController;
