import type { NextConfig } from 'next';
import {hosting} from './explorer.config.json';
const nextConfig:NextConfig={basePath:process.env.EXPLORER_BUILD_TARGET==='node'?hosting.basePath:''};
export default nextConfig;
