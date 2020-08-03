const express = require('express');
const passport = require('passport');
const router = express.Router();

// Dashboard Index
router.get('/', (req, res) => {
    const name = "Dashboard";
    console.log("Dashboard Index Requested");
    res.render('dashboard/dashboard', {title: name});
});

// Dashboard Profile
router.get('/perfil', (req, res) => {
    const name = "Mi Perfil";
    console.log("Dashboard Profile Requested");
    res.render('dashboard/dash-perfil', {title: name})
});

// Dashboard Make New Order
router.get('/nuevo-envio', (req, res) => {
    const name = "Nuevo Envio";
    console.log("Dashboard New Order Requested");
    res.render('dashboard/dash-envio', {title: name});
});

// Dashboard Order History
router.get('/hist-pedidos', (req, res) => {
    const name = "Historial Pedidos";
    console.log("Dashboard Order History Requested");
    res.render('dashboard/dash-hist-pedidos', {title: name});
});

// Dashboard Payment History
router.get('/hist-pagos', (req, res) => {
    const name = "Historial Pagos";
    console.log("Dashboard Payment History Requested");
    res.render('dashboard/dash-hist-pagos', {title: name});
});

// Dashboard Cost Tables
router.get('/costos', (req, res) => {
    const name = "Tablas de Costos";
    console.log("Dashboard Cost Tables Requested");
    res.render('dashboard/dash-costos', {title: name});
});

// Dashboard Support
router.get('/soporte', (req, res) => {
    const name = "Ayuda y Soporte";
    console.log("Dashboard Support Requested");
    res.render('dashboard/dash-soporte', {title: name});
});

module.exports = router;