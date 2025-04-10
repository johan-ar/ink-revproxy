import { useState, useEffect, useRef } from "react";


const useTick = () => {
    const [tick, setTick] = useState(0);
    const ref = useRef(0);

    const updateTick = () => {
        setTick(t => {
            ref.current = t + 1
            return ref.current
        });
    };

    useEffect(() => {
        setTick(t => {
            ref.current = t + 1
            return ref.current
        });
    }, []);



    return tick;
};