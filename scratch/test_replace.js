
const formatCurrency = (m) => m.toString();
const datos = {
    cliente: "Juan",
    monto: "100",
    moneda: "$",
    link_whatsapp: "https://wa.me/123"
};
let html = '<a href="{{link_whatsapp}}">Click</a>';

Object.keys(datos).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    console.log('Testing key:', key, 'Regex:', regex);
    html = html.replace(regex, () => datos[key]);
});

console.log('Result:', html);
