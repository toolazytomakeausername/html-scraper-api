fetch thing

idk it fetches a url and dumps html as json. works on vercel, netlify, aws lambda, cloudflare.

usage:
/fetch?url=https://example.com&sanitize=true

output:
{
"url": "http://example.com
",
"status": 200,
"length": 1270,
"html": "<!doctype html>..."
}

if it fails:
{ "error": "blocked url" }

notes:

sanitize=false by default

sanitize=true blocks localhost & private ranges, strips <script>, and chops responses >1mb

thats basically it

deploy:

vercel: export default async (req,res)=>{...}

netlify: exports.handler=...

aws: exports.lambdaHandler=...

cloudflare: export async function fetch(req){...}
