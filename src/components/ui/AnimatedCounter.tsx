import { useEffect, useRef, useState } from 'react'
import { useSpring, useTransform } from 'framer-motion'

export function AnimatedCounter({ value }: { value: number }) {
  const started = useRef(false)
  const spring = useSpring(value, { stiffness: 90, damping: 22 })
  const display = useTransform(spring, (v) => Math.round(v))
  const [text, setText] = useState(String(value))

  useEffect(() => {
    if (!started.current) {
      started.current = true
      spring.jump(value)
      setText(String(value))
      return
    }
    spring.set(value)
  }, [spring, value])

  useEffect(() => {
    const unsub = display.on('change', (v) => setText(String(v)))
    return unsub
  }, [display])

  return (
    <span className="tabular-nums" aria-label={String(value)}>
      {text}
    </span>
  )
}
