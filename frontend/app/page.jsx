import Mobile from '../components/Mobile';
import Desktop from '../components/Desktop';
export default function Page() {
  return (<>
    <div className="lg:hidden min-h-screen bg-lav-2 flex justify-center"><Mobile /></div>
    <div className="hidden lg:block"><Desktop /></div>
  </>);
}
