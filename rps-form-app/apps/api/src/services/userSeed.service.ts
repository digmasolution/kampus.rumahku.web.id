import { prisma } from './rps.service';

export async function seedUsers() {
  const users = [
    {
      email: 'admin@kampus.rumahku.web.id',
      name: 'Administrator Kampus',
      password: '11jTKLM0sa',
      role: 'ADMIN',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminKampus',
    },
    {
      email: 'dosen1@uncm.ac.id',
      name: 'Dr. Ahmad Fauzi, M.Kom',
      password: 'password123',
      role: 'DOSEN',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DosenUNCM',
    },
    {
      email: 'dosen2@itb.ac.id',
      name: 'Prof. Siti Nurhaliza, Ph.D',
      password: 'password123',
      role: 'DOSEN',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DosenITB',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        password: u.password,
        role: u.role,
        avatar: u.avatar,
      },
      create: u,
    });
  }
}
