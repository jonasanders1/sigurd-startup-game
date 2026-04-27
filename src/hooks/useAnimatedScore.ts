import { useState, useEffect, useRef } from "react";

/**
 * Smoothly animates a number toward a target value.
 * Unlike useAnimatedCounter (one-shot), this reacts to every change.
 */
export function useAnimatedScore(target: number, speed = 0.12): number {
    const [display, setDisplay] = useState(target);
    const rafRef = useRef<number>(0);
    const currentRef = useRef(target);

    useEffect(() => {
        let running = true;

        const tick = () => {
            if (!running) return;
            const diff = target - currentRef.current;
            if (Math.abs(diff) < 1) {
                currentRef.current = target;
                setDisplay(target);
                return;
            }
            // Lerp toward target — fast at first, decelerates
            currentRef.current += diff * speed;
            setDisplay(Math.round(currentRef.current));
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            running = false;
            cancelAnimationFrame(rafRef.current);
        };
    }, [target, speed]);

    return display;
}
