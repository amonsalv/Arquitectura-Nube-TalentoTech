document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const calculoForm = document.getElementById('calculoForm');
    const btnCalcular = document.getElementById('btnCalcular');
    const loadingElement = document.getElementById('loading');
    const resultadoElement = document.getElementById('resultado');
    const resultadoExtraElement = document.getElementById('resultadoExtra');
    const errorElement = document.getElementById('error');
    
    // Elementos de resultado
    const valorMomento = document.getElementById('valor-momento');
    const valorPhi = document.getElementById('valor-phi');
    const valorC = document.getElementById('valor-c');
    const valorEst = document.getElementById('valor-est');
    const tipoFalla = document.getElementById('tipo-falla');
    
    // URL de la API Lambda (reemplazar con la URL real de API Gateway)
    //const API_URL = 'https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/calculo-viga';
    //const API_URL = 'http://511fm6r9hf.execute-api.us-east-1.amazonaws.com/default/RevisionViga';
    const API_URL = 'https://szv7sn75r3tjxdc2pzoi2p36uy0sghpf.lambda-url.us-east-1.on.aws/';
    
    // Evento de clic en el botón calcular
    btnCalcular.addEventListener('click', calcularMomento);
    
    // Función principal para realizar el cálculo
    async function calcularMomento() {
        // Mostrar loading y ocultar otros elementos
        loadingElement.style.display = 'flex';
        resultadoElement.style.display = 'none';
        errorElement.style.display = 'none';
        
        // Obtener valores del formulario
        const baseViga = parseFloat(document.getElementById('baseViga').value);
        const alturaViga = parseFloat(document.getElementById('alturaViga').value);
        const distBarraSup = parseFloat(document.getElementById('distBarraSup').value);
        const distBarraInf = parseFloat(document.getElementById('distBarraInf').value);
        const fc = parseFloat(document.getElementById('fc').value);
        const fy = parseFloat(document.getElementById('fy').value);
        const aceroTraccion = parseFloat(document.getElementById('aceroTraccion').value);
        const aceroCompresion = parseFloat(document.getElementById('aceroCompresion').value);
        
        // Validar que todos los campos tengan valores
        if (!baseViga || !alturaViga || !distBarraSup || !distBarraInf || !fc || !fy || !aceroTraccion || isNaN(aceroCompresion)) {
            mostrarError('Por favor complete todos los campos con valores numéricos válidos.');
            return;
        }
        
        // Validar rangos de valores
        if (baseViga < 10 || baseViga > 100) {
            mostrarError('La base de la viga debe estar entre 10 y 100 cm.');
            return;
        }
        
        if (alturaViga < 15 || alturaViga > 200) {
            mostrarError('La altura de la viga debe estar entre 15 y 200 cm.');
            return;
        }
        
        if (distBarraSup < 3 || distBarraSup > 20) {
            mostrarError('La distancia a la barra superior debe estar entre 3 y 20 cm.');
            return;
        }
        
        if (distBarraInf < 3 || distBarraInf > 20) {
            mostrarError('La distancia a la barra inferior debe estar entre 3 y 20 cm.');
            return;
        }
        
        if (fc < 140 || fc > 500) {
            mostrarError('La resistencia del concreto debe estar entre 140 y 500 kg/cm².');
            return;
        }
        
        if (fy < 2800 || fy > 6000) {
            mostrarError('El esfuerzo de fluencia del acero debe estar entre 2800 y 6000 kg/cm².');
            return;
        }
        
        if (aceroTraccion <= 0 || aceroTraccion > 100) {
            mostrarError('El área de acero a tracción debe estar entre 0.1 y 100 cm².');
            return;
        }
        
        if (aceroCompresion < 0 || aceroCompresion > 100) {
            mostrarError('El área de acero a compresión debe estar entre 0 y 100 cm².');
            return;
        }
        
        // Preparar datos para la API según la estructura RevisionRequest
        const datosViga = {
            Base: baseViga,
            Altura: alturaViga,
            DistanciaBarraSup: distBarraSup,
            DistanciaBarraInf: distBarraInf,
            Fc: fc,
            Fy: fy,
            AceroTraccion: aceroTraccion,
            AceroCompresion: aceroCompresion
        };
        
        try {
            // Llamar a la API Lambda mediante API Gateway
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosViga),
                mode: 'cors' // Especificar modo CORS explícitamente
            });
            
            // Verificar si la respuesta HTTP es correcta
            if (!response.ok) {
                throw new Error(`Error de servidor: ${response.status} ${response.statusText}`);
            }
            
            const resultado = await response.json();
            
            // Ocultar loading
            loadingElement.style.display = 'none';
            
            if (resultado.Success) {
                // Si hay éxito, mostrar el resultado
                mostrarResultado(resultado);
            } else {
                // Si hay error en el cálculo, mostrar mensaje
                mostrarError(`Error en el cálculo: ${resultado.ErrorMessage}`);
            }
        } catch (error) {
            // Manejar errores de red o formato
            mostrarError(`Error de conexión: ${error.message}`);
        }
    }
    
    // Función para mostrar el resultado del cálculo
    function mostrarResultado(resultado) {
        // Mostrar el momento calculado
        valorMomento.textContent = resultado.MomentoResistente.toFixed(2);
        valorPhi.textContent = resultado.CoeficienteResistencia_Phi.toFixed(2);
        valorC.textContent = resultado.DistanciaEjeNeutro_C.toFixed(2);
        valorEst.textContent = resultado.DeformacionTraccion_est.toExponential(4);
        
        // Determinar tipo de falla basado en la deformación a tracción
        let falla = "Dúctil";
        if (resultado.DeformacionTraccion_est <= 0.002) {
            falla = "Frágil por compresión";
        } else if (resultado.DeformacionTraccion_est > 0.002 && resultado.DeformacionTraccion_est <= 0.005) {
            falla = "Transición";
        }
        
        tipoFalla.textContent = falla;
        
        // Mostrar el elemento de resultado
        resultadoElement.style.display = 'block';
        resultadoExtraElement.style.display = 'block';
    }
    
    // Función para mostrar errores
    function mostrarError(mensaje) {
        loadingElement.style.display = 'none';
        errorElement.style.display = 'block';
        document.getElementById('mensaje-error').textContent = mensaje;
    }
});