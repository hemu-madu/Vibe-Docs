import { useRef, useEffect } from 'react';

export default function Waveform({ audioStream, isActive }) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const analyzerRef = useRef(null);
    const dataArrayRef = useRef(null);

    useEffect(() => {
        if (!audioStream || !isActive) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(audioStream);
        const analyzer = audioContext.createAnalyser();

        analyzer.fftSize = 256;
        source.connect(analyzer);

        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        analyzerRef.current = analyzer;
        dataArrayRef.current = dataArray;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const draw = () => {
            if (!isActive) return;
            animationRef.current = requestAnimationFrame(draw);

            analyzer.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Fade effect
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;

                const r = barHeight + 25 * (i / bufferLength);
                const g = 250 * (i / bufferLength);
                const b = 50;

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();

        return () => {
            cancelAnimationFrame(animationRef.current);
            audioContext.close();
        };
    }, [audioStream, isActive]);

    return (
        <canvas
            ref={canvasRef}
            width={600}
            height={100}
            className="w-full h-24 rounded-lg opacity-80"
        />
    );
}
