// permanently redirect to ai-comic-generator page

export async function getServerSideProps() {
    return {
        redirect: {
            destination: "/ai-comic-generator",
            permanent: true,
        },
    };
}

export default function DummyPage() {
    return null;
}