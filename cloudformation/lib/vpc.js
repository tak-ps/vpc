import cf from '@mapbox/cloudfriend';

export default {
    Resources: {
        VPC: {
            Type: 'AWS::EC2::VPC',
            Properties: {
                EnableDnsHostnames: true,
                EnableDnsSupport: true,
                CidrBlock: '172.31.0.0/16',
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName])
                }]
            }
        },
        SubnetPublic: {
            Type: 'AWS::EC2::Subnet',
            Properties: {
                AvailabilityZone: cf.findInMap('AWSRegion2AZ', cf.region, '1'),
                VpcId: cf.ref('VPC'),
                CidrBlock: '172.31.1.0/24',
                MapPublicIpOnLaunch: true,
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-subnet-public'])
                }]
            }
        },
        SubnetPrivate: {
            Type: 'AWS::EC2::Subnet',
            Properties: {
                AvailabilityZone: cf.findInMap('AWSRegion2AZ', cf.region, '2'),
                VpcId: cf.ref('VPC'),
                CidrBlock: '172.31.2.0/24',
                MapPublicIpOnLaunch: true,
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-subnet-private'])
                }]
            }
        },
        InternetGateway: {
            Type: 'AWS::EC2::InternetGateway',
            Properties: {
                Tags: [{
                    Key: 'Name',
                    Value: cf.join([cf.stackName, '-gateway'])
                },{
                    Key: 'Network',
                    Value: 'Public'
                }]
            }
        },
        VPCIG: {
            Type: 'AWS::EC2::VPCGatewayAttachment',
            Properties: {
                InternetGatewayId: cf.ref('InternetGateway'),
                VpcId: cf.ref('VPC')
            }
        },
        RouteTable: {
            Type: 'AWS::EC2::RouteTable',
            Properties: {
                VpcId: cf.ref('VPC'),
                Tags: [{
                    Key: 'Network',
                    Value: 'Public'
                }]
            }
        },
        PublicRoute: {
            Type: 'AWS::EC2::Route',
            DependsOn:  'VPCIG',
            Properties: {
                RouteTableId: cf.ref('RouteTable'),
                DestinationCidrBlock: '0.0.0.0/0',
                GatewayId: cf.ref('InternetGateway')
            }
        },
        SubnetPublicAssoc: {
            Type: 'AWS::EC2::SubnetRouteTableAssociation',
            Properties: {
                RouteTableId: cf.ref('RouteTable'),
                SubnetId: cf.ref('SubnetPublic')
            }
        },
        SubnetPrivateAssoc: {
            Type: 'AWS::EC2::SubnetRouteTableAssociation',
            Properties: {
                RouteTableId: cf.ref('RouteTable'),
                SubnetId: cf.ref('SubnetPrivate')
            }
        },
        NatGateway: {
            Type: 'AWS::EC2::NatGateway',
            DependsOn: 'NatPublicIP',
            Properties:  {
                AllocationId: cf.getAtt('NatPublicIP', 'AllocationId'),
                SubnetId: cf.ref('SubnetPublic')
            }
        },
        NatPublicIP: {
            Type: 'AWS::EC2::EIP',
            DependsOn: 'VPC',
            Properties: {
                Domain: 'vpc'
            }
        }
    },
    Mappings: {
        AWSRegion2AZ: {
            'us-gov-east-1': { '1': 'us-gov-east-1a', '2': 'us-gov-east-1b', '3': 'us-gov-east-1c' },
            'us-gov-west-1': { '1': 'us-gov-west-1a', '2': 'us-gov-west-1b', '3': 'us-gov-west-1c' },
            'us-east-1': { '1': 'us-east-1b', '2': 'us-east-1c', '3': 'us-east-1d', '4': 'us-east-1e' },
            'us-west-1': { '1': 'us-west-1b', '2': 'us-west-1c' },
            'us-west-2': { '1': 'us-west-2a', '2': 'us-west-2b', '3': 'us-west-2c'  }
        }
    }
};
