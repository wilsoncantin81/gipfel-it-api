// v2 test
async getTechnicians() {
  return this.prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });
}
```

Haz commit de ambos archivos. Después del deploy prueba:
```
https://gipfel-it-api-production.up.railway.app/api/v1/clients/technicians
