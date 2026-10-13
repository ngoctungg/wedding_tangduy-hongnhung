import { bindings, defineConfig } from "cf/config";


export default defineConfig({
	worker: {
		name: "nhung",
		compatibilityDate: "2024-09-23",
		entrypoint: "src/worker.js",
		env: {
			DB: bindings.d1({
				name: "nhung-duy-db",
				id: "1feb0d43-f56f-4500-b042-44ed6ebec1e1",
			}),
			ASSETS: bindings.assets(),
		},
	},
});
