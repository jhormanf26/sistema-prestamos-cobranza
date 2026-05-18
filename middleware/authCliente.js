module.exports = (req, res, next) => {
    if (req.session.cliente) {
        next();
    } else {
        res.redirect('/portal-cliente/login');
    }
};
