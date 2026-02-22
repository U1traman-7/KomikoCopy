import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/copyright.html',
    permanent: false,
  },
});

export default function Page() {
  return null;
}
