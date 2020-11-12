export function QuadraticTweening(milliSec:number, startTime:number, onUpdate:(number)=>void, onComplete:()=>void) {
    const passedMillis = Date.now() - startTime
    if (milliSec < passedMillis)  {
        onUpdate(1);
        requestAnimationFrame(onComplete);
    } else {
        const x = passedMillis / milliSec;
        const eased = x < 0.5 ? 2*x*x : -2*x*x+4*x-1
        onUpdate(eased)
        requestAnimationFrame(()=>QuadraticTweening(milliSec, startTime, onUpdate, onComplete));
    }
}