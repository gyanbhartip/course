# SSL Certificates for Local Development

This directory is used to store SSL certificates for HTTPS support in local development.

## For Local Development

You can generate self-signed certificates for local development:

```bash
# Generate a self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## For Production

In production, replace these with proper SSL certificates from a trusted Certificate Authority.

## Files

-   `cert.pem` - SSL certificate file
-   `key.pem` - SSL private key file

## Note

The nginx configuration will work without SSL certificates for HTTP-only local development.
HTTPS is optional and can be enabled by uncommenting the HTTPS server block in nginx.conf.
