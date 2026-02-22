// permanently redirect to oc-maker page

export async function getServerSideProps() {
    return {
        redirect: {
            destination: "/oc-maker",
            permanent: true,
        },
    };
}

export default function DummyPage() {
    return null;
}