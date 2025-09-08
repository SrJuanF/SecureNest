import { Suspense, lazy } from "react";

// Lazy load page components
const EERC = lazy(() =>
	import("./pages/EERC").then((module) => ({ default: module.EERC })),
);

// Loading component
const LoadingFallback = () => (
	<div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
		<div className="text-white font-mono text-xl">Loading TimeLock Vault...</div>
	</div>
);

export function App() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
			<Suspense fallback={<LoadingFallback />}>
				<EERC />
			</Suspense>
		</div>
	);
}

export default App;
