# Tutorial: Native Swipe Gestures with Framer Motion

This tutorial explains how we implemented fluid, native-feeling swipe actions for the Expense Tracker transaction list.

## 1. Prerequisites
Install `framer-motion`:
```bash
npm install framer-motion
```

## 2. Component Structure
The `TransactionRow` consists of two layers:
1. **Background Layer**: Contains the icons/actions that appear when swiping (Copy, Delete).
2. **Foreground Layer**: The actual transaction content that the user drags.

```tsx
<div className="relative overflow-hidden">
    {/* 1. Background Layer (hidden initially) */}
    <div className="absolute inset-0 flex justify-between px-6">
        <div className="blue-copy-icon" />
        <div className="red-trash-icon" />
    </div>

    {/* 2. Foreground Layer (draggable) */}
    <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        className="z-10 bg-white"
    >
        {/* Transaction Content */}
    </motion.div>
</div>
```

## 3. Handling the Gesture
We use the `drag` prop and `onDragEnd` to trigger actions based on distance.

```tsx
const controls = useAnimation();

const handleDragEnd = (event, info) => {
    const threshold = 100;
    if (info.offset.x < -threshold) {
        onDelete(); // Swipe Left
    } else if (info.offset.x > threshold) {
        onCopy(); // Swipe Right
    }
    
    // Always snap back to center
    controls.start({ x: 0 });
};
```

## 4. Key Concepts
- **`drag="x"`**: Limits dragging to the horizontal axis.
- **`dragConstraints={{ left: 0, right: 0 }}`**: Together with spring physics, this makes the element "stretch" and then snap back.
- **`useAnimation`**: Allows us to programmatically reset the position (`x: 0`) after the gesture ends.
- **`touch-pan-y`**: This CSS property is crucial. It tells the browser that vertical scrolling is handled by the page, while horizontal dragging is handled by our script.

## 5. Responsive Integration
To keep the desktop experience clean, we use Tailwind's `md:hidden` and `hidden md:block` classes:
- **Mobile**: Show the swipeable list (`TransactionRow`).
- **Desktop**: Show the standard `Table` with action buttons.
